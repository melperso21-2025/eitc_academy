# Script para probar el upload de imagen a Firebase

$API_BASE = "http://localhost:8000/api"
$TOKEN = ""

# 1. Primero login para obtener token
Write-Host "=== LOGIN ===" -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "$API_BASE/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body @{
    email = "admin@eitc.com"
    password = "password123"
  } | ConvertTo-Json -Depth 10

Write-Host "Login Response: $loginResponse"

$loginData = $loginResponse | ConvertFrom-Json
$TOKEN = $loginData.data.token

Write-Host "Token obtenido: $($TOKEN.Substring(0, [Math]::Min(20, $TOKEN.Length)))..."

if (-not $TOKEN) {
  Write-Host "Error: No se pudo obtener el token" -ForegroundColor Red
  exit 1
}

# 2. Crear un nuevo curso primero
Write-Host "`n=== CREAR CURSO ===" -ForegroundColor Cyan
$courseResponse = Invoke-RestMethod -Uri "$API_BASE/courses" `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{
    Authorization = "Bearer $TOKEN"
  } `
  -Body @{
    name = "Test Course with Image"
    category_id = 1
    description = "Test description"
    price = 99.99
    modality = "online"
    level = "beginner"
    duration = 30
    certificate = 1
    publish = 1
  } | ConvertTo-Json -Depth 10

Write-Host "Course Response: $courseResponse"

$courseData = $courseResponse | ConvertFrom-Json
$COURSE_ID = $courseData.data.id

Write-Host "Curso creado con ID: $COURSE_ID" -ForegroundColor Green

if (-not $COURSE_ID) {
  Write-Host "Error: No se pudo crear el curso" -ForegroundColor Red
  exit 1
}

# 3. Intentar subir una imagen
Write-Host "`n=== SUBIR IMAGEN ===" -ForegroundColor Cyan

# Buscar una imagen en el sistema para usar como prueba
$imagePath = "C:\Windows\System32\drivers\etc\hosts"  # Usar un archivo pequeño para prueba

if (Test-Path $imagePath) {
  Write-Host "Subiendo imagen de prueba..." -ForegroundColor Yellow
  
  # Usar Form Data para multipart upload
  $form = @{
    image = Get-Item -Path $imagePath
  }
  
  try {
    $uploadResponse = Invoke-WebRequest -Uri "$API_BASE/courses/$COURSE_ID/upload-image" `
      -Method Post `
      -Headers @{
        Authorization = "Bearer $TOKEN"
      } `
      -Form $form `
      -SkipHttpErrorCheck

    Write-Host "Upload Status: $($uploadResponse.StatusCode)" -ForegroundColor $(if($uploadResponse.StatusCode -eq 201 -or $uploadResponse.StatusCode -eq 200) { 'Green' } else { 'Red' })
    Write-Host "Upload Response: $($uploadResponse.Content)" 
  } catch {
    Write-Host "Error during upload: $_" -ForegroundColor Red
  }
} else {
  Write-Host "Archivo de prueba no encontrado" -ForegroundColor Red
}

Write-Host "`n=== TEST COMPLETADO ===" -ForegroundColor Cyan
