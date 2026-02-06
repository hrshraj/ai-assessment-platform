#!/bin/bash
# =====================================================
# AI Assessment Platform - Quick Setup Script
# Run this to get everything up and running!
# =====================================================

set -e

echo "🚀 AI Assessment Platform - Setup"
echo "=================================="

# ── Option 1: Docker (Recommended) ──
if command -v docker &> /dev/null; then
    echo "✅ Docker found. Starting with Docker Compose..."
    
    docker compose up -d
    
    echo "⏳ Waiting for Ollama to start..."
    sleep 10
    
    echo "📦 Pulling Mistral model (this may take 5-10 min first time)..."
    docker exec -it $(docker ps -qf "name=ollama") ollama pull mistral
    
    echo "📦 Pulling CodeLlama model..."
    docker exec -it $(docker ps -qf "name=ollama") ollama pull codellama
    
    echo ""
    echo "✅ All services running!"
    echo "   📡 API:    http://localhost:8000"
    echo "   📚 Docs:   http://localhost:8000/docs"
    echo "   🤖 Ollama: http://localhost:11434"
    exit 0
fi

# ── Option 2: Manual Setup ──
echo "Docker not found. Setting up manually..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Please install Python 3.11+"
    exit 1
fi

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Check Ollama
if ! command -v ollama &> /dev/null; then
    echo ""
    echo "⚠️  Ollama not found. Install it:"
    echo "   curl -fsSL https://ollama.com/install.sh | sh"
    echo ""
    echo "Then pull models:"
    echo "   ollama pull mistral"
    echo "   ollama pull codellama"
    echo ""
    echo "Start Ollama:"
    echo "   ollama serve"
else
    echo "✅ Ollama found"
    echo "📦 Pulling models..."
    ollama pull mistral
    ollama pull codellama
fi

echo ""
echo "🚀 To start the server:"
echo "   python3 main.py"
echo ""
echo "   Or with uvicorn:"
echo "   uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "📚 API Docs: http://localhost:8000/docs"
