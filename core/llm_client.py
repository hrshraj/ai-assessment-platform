"""
LLM Client - Wrapper around Ollama for all AI operations.
Handles prompt execution, JSON parsing, retries, and fallbacks.
"""
import json
import re
import logging
from typing import Optional
import httpx

from config import settings

logger = logging.getLogger(__name__)


class LLMClient:
    """Unified client for interacting with Ollama-hosted models."""

    def __init__(self, base_url: str = None, model: str = None):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.model = model or settings.OLLAMA_MODEL
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
        """Generate a response from the LLM."""
        model = model or self.model
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
            logger.error(f"LLM request timed out for model {model}")
            raise TimeoutError("LLM request timed out. Ensure Ollama is running.")
        except httpx.HTTPStatusError as e:
            logger.error(f"LLM HTTP error: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"LLM error: {e}")
            raise

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
        """Check if Ollama is running and model is available."""
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


# Singleton instance
llm_client = LLMClient()
