#!/bin/bash
# Script para probar el upload de imagen a Firebase

API_BASE="http://localhost:8000/api"
TOKEN=""

# 1. Primero login para obtener token
echo "=== LOGIN ==="
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@eitc.com",
    "password": "password123"
  }')

echo "Login Response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "Token obtenido: ${TOKEN:0:20}..."

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Error: No se pudo obtener el token"
  exit 1
fi

# 2. Crear un nuevo curso primero
echo -e "\n=== CREAR CURSO ==="
COURSE_RESPONSE=$(curl -s -X POST "$API_BASE/courses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Course with Image",
    "category_id": 1,
    "description": "Test description",
    "price": 99.99,
    "modality": "online",
    "level": "beginner",
    "duration": 30,
    "certificate": 1,
    "publish": 1
  }')

echo "Course Response: $COURSE_RESPONSE"

COURSE_ID=$(echo $COURSE_RESPONSE | jq -r '.data.id')
echo "Curso creado con ID: $COURSE_ID"

if [ "$COURSE_ID" == "null" ] || [ -z "$COURSE_ID" ]; then
  echo "Error: No se pudo crear el curso"
  exit 1
fi

# 3. Intentar subir una imagen
echo -e "\n=== SUBIR IMAGEN ==="

# Crear una imagen de prueba simple
dd if=/dev/urandom of=/tmp/test.jpg bs=1024 count=100 2>/dev/null

UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/courses/$COURSE_ID/upload-image" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/tmp/test.jpg")

echo "Upload Response: $UPLOAD_RESPONSE"

rm /tmp/test.jpg
