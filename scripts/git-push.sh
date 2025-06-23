#!/bin/bash

# Script para hacer add, commit y push automáticamente
# Uso: ./scripts/git-push.sh "mensaje del commit"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verificar si se proporcionó un mensaje de commit
if [ -z "$1" ]; then
    print_error "Debes proporcionar un mensaje de commit"
    echo "Uso: $0 \"mensaje del commit\""
    echo "Ejemplo: $0 \"feat: add dynamic Ollama model support\""
    exit 1
fi

COMMIT_MESSAGE="$1"

print_step "🚀 Iniciando proceso de git add, commit y push..."

# Verificar si estamos en un repositorio git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "No estás en un repositorio git"
    exit 1
fi

# Verificar si hay cambios para commitear
if git diff-index --quiet HEAD --; then
    print_warning "No hay cambios para commitear"
    exit 0
fi

# Paso 1: Add todos los cambios
print_step "📦 Agregando cambios..."
if git add .; then
    print_message "✅ Cambios agregados exitosamente"
else
    print_error "❌ Error al agregar cambios"
    exit 1
fi

# Paso 2: Commit con el mensaje proporcionado
print_step "💾 Haciendo commit..."
if git commit -m "$COMMIT_MESSAGE"; then
    print_message "✅ Commit realizado exitosamente"
else
    print_error "❌ Error al hacer commit"
    exit 1
fi

# Paso 3: Push al repositorio remoto
print_step "🚀 Haciendo push..."
if git push; then
    print_message "✅ Push realizado exitosamente"
else
    print_error "❌ Error al hacer push"
    print_warning "Puedes intentar hacer push manualmente con: git push"
    exit 1
fi

print_message "🎉 ¡Proceso completado exitosamente!"
print_message "Commit: $COMMIT_MESSAGE" 