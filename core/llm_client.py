"""
LLM Client - Supports both Ollama (local) and Groq (cloud).
Set LLM_PROVIDER=groq in .env to use Groq's free API.
Set LLM_PROVIDER=ollama (default) for local Ollama.
"""
import json
import re
import logging
import asyncio
from typing import Optional
import httpx

from config import settings

logger = logging.getLogger(__name__)


class LLMClient:
    """Unified client supporting Ollama and Groq backends."""

    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()  # "ollama" or "groq"

        if self.provider == "groq":
            self.api_key = settings.GROQ_API_KEY
            self.model = settings.GROQ_MODEL
            self.coding_model = settings.GROQ_CODING_MODEL
            self.base_url = "https://api.groq.com/openai/v1"
            if not self.api_key:
                logger.warning("⚠️ GROQ_API_KEY not set! Get one free at https://console.groq.com")
        else:
            self.base_url = settings.OLLAMA_BASE_URL
            self.model = settings.OLLAMA_MODEL
            self.coding_model = settings.OLLAMA_CODING_MODEL

    async def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        format_json: bool = False,
    ) -> str:
        """Generate a response from the LLM (auto-routes to Ollama or Groq)."""
        model = model or self.model

        if self.provider == "groq":
            return await self._generate_groq(
                prompt, system_prompt, model, temperature, max_tokens, format_json
            )
        else:
            return await self._generate_ollama(
                prompt, system_prompt, model, temperature, max_tokens, format_json
            )

    async def _generate_ollama(
        self, prompt, system_prompt, model, temperature, max_tokens, format_json
    ) -> str:
        """Generate using local Ollama."""
        payload = {
            "model": model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        if format_json:
            payload["format"] = "json"

        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                )
                response.raise_for_status()
                result = response.json()
                return result.get("response", "")
        except httpx.TimeoutException:
            logger.error(f"Ollama request timed out for model {model}")
            raise TimeoutError("LLM request timed out. Ensure Ollama is running.")
        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama HTTP error: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            raise

    async def _generate_groq(
        self, prompt, system_prompt, model, temperature, max_tokens, format_json
    ) -> str:
        """Generate using Groq cloud API (OpenAI-compatible)."""
        messages = []
        if system_prompt:
            content = system_prompt
            if format_json:
                content += "\n\nIMPORTANT: You MUST respond with valid JSON only. No extra text."
            messages.append({"role": "system", "content": content})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if format_json:
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        max_retries = 5
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        json=payload,
                        headers=headers,
                    )
                    response.raise_for_status()
                    result = response.json()
                    return result["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429 and attempt < max_retries - 1:
                    retry_after = e.response.headers.get("retry-after")
                    wait_time = float(retry_after) if retry_after else min(2 ** attempt * 3, 60)
                    logger.warning(
                        f"Groq rate limited (attempt {attempt+1}/{max_retries}). "
                        f"Waiting {wait_time:.0f}s..."
                    )
                    await asyncio.sleep(wait_time)
                    continue
                logger.error(f"Groq HTTP error: {e.response.status_code} - {e.response.text[:300]}")
                raise
            except httpx.TimeoutException:
                logger.error(f"Groq request timed out for model {model}")
                raise TimeoutError("Groq API request timed out.")
            except Exception as e:
                logger.error(f"Groq error: {e}")
                raise

        raise TimeoutError(f"Groq rate limit: still limited after {max_retries} retries")

    async def generate_json(
        self,
        prompt: str,
        system_prompt: str = "",
        model: str = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> dict:
        """Generate and parse a JSON response from the LLM."""
        raw = await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            format_json=True,
        )
        return self._parse_json(raw)

    async def generate_code_evaluation(
        self, prompt: str, system_prompt: str = ""
    ) -> dict:
        """Use the coding-specialized model for code evaluation."""
        return await self.generate_json(
            prompt=prompt,
            system_prompt=system_prompt,
            model=self.coding_model,
            temperature=0.2,
            max_tokens=4096,
        )

    def _parse_json(self, raw: str) -> dict:
        """Robustly parse JSON from LLM output."""
        # Try direct parse
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # Try extracting JSON from markdown code blocks
        json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", raw, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        # Try finding JSON object/array in text
        for pattern in [r"\{.*\}", r"\[.*\]"]:
            match = re.search(pattern, raw, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    continue

        logger.error(f"Failed to parse JSON from LLM response: {raw[:200]}...")
        return {"error": "Failed to parse LLM response", "raw": raw}

    async def check_health(self) -> bool:
        """Check if LLM backend is available."""
        if self.provider == "groq":
            return await self._check_groq_health()
        return await self._check_ollama_health()

    async def _check_ollama_health(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    models = [m["name"] for m in resp.json().get("models", [])]
                    return self.model in models or any(
                        self.model in m for m in models
                    )
            return False
        except Exception:
            return False

    async def _check_groq_health(self) -> bool:
        if not self.api_key:
            return False
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{self.base_url}/models",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                return resp.status_code == 200
        except Exception:
            return False


# Singleton instance
llm_client = LLMClient()
