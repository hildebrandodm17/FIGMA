#!/usr/bin/env bash
# Script de build para o Render — compila o frontend e instala o backend
set -e

echo "=== Instalando dependências do backend ==="
cd cms-backend
pip install -r requirements.txt

echo "=== Instalando dependências do frontend ==="
cd ../cms-admin
npm ci

echo "=== Build do frontend (React) ==="
npm run build

echo "=== Build concluído ==="
echo "Frontend em: cms-admin/dist/"
echo "Backend pronto para: uvicorn main:app"
