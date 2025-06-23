#!/bin/bash

# Script para publicar en npm automáticamente
# Uso: ./scripts/npm-publish.sh [version]

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_success() {
    echo -e "${PURPLE}[SUCCESS]${NC} $1"
}

# Función para confirmar acción
confirm_action() {
    local message="$1"
    echo -e "${YELLOW}$message${NC}"
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Operación cancelada"
        exit 0
    fi
}

# Verificar si estamos en un repositorio git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "No estás en un repositorio git"
    exit 1
fi

# Verificar si hay cambios sin commitear
if ! git diff-index --quiet HEAD --; then
    print_warning "Hay cambios sin commitear"
    confirm_action "¿Quieres hacer commit de los cambios antes de publicar?"
    
    if [ -z "$1" ]; then
        read -p "Mensaje de commit: " commit_message
    else
        commit_message="chore: prepare for release v$1"
    fi
    
    print_step "📦 Haciendo commit de cambios..."
    if git add . && git commit -m "$commit_message"; then
        print_message "✅ Commit realizado"
    else
        print_error "❌ Error al hacer commit"
        exit 1
    fi
fi

# Obtener versión actual
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_message "📋 Versión actual: $CURRENT_VERSION"

# Si se proporciona una nueva versión
if [ ! -z "$1" ]; then
    NEW_VERSION="$1"
    print_step "🔄 Actualizando versión a $NEW_VERSION..."
    
    # Actualizar package.json
    if npm version "$NEW_VERSION" --no-git-tag-version; then
        print_message "✅ Versión actualizada a $NEW_VERSION"
    else
        print_error "❌ Error al actualizar versión"
        exit 1
    fi
else
    NEW_VERSION="$CURRENT_VERSION"
    print_warning "No se especificó nueva versión, usando la actual: $NEW_VERSION"
fi

# Verificar que estás logueado en npm
print_step "🔐 Verificando login de npm..."
if ! npm whoami > /dev/null 2>&1; then
    print_error "No estás logueado en npm"
    print_message "Ejecuta: npm login"
    exit 1
fi

print_message "✅ Logueado como: $(npm whoami)"

# Verificar que no hay errores de linting
print_step "🔍 Verificando linting..."
if npm run lint > /dev/null 2>&1; then
    print_message "✅ Linting OK"
else
    print_warning "⚠️ Hay errores de linting"
    confirm_action "¿Continuar con la publicación?"
fi

# Verificar que los tests pasan
print_step "🧪 Ejecutando tests..."
if npm run test:run > /dev/null 2>&1; then
    print_message "✅ Tests pasan"
else
    print_error "❌ Los tests fallan"
    confirm_action "¿Continuar con la publicación?"
fi

# Verificar que el build funciona
print_step "🔨 Verificando build..."
if npm run build > /dev/null 2>&1; then
    print_message "✅ Build exitoso"
else
    print_error "❌ Error en el build"
    exit 1
fi

# Mostrar información del paquete
PACKAGE_NAME=$(node -p "require('./package.json').name")
print_step "📦 Información del paquete:"
echo "  Nombre: $PACKAGE_NAME"
echo "  Versión: $NEW_VERSION"
echo "  Descripción: $(node -p "require('./package.json').description")"

# Confirmar publicación
confirm_action "¿Publicar $PACKAGE_NAME@$NEW_VERSION en npm?"

# Publicar en npm
print_step "🚀 Publicando en npm..."
if npm publish --access public; then
    print_success "🎉 ¡Publicación exitosa!"
    print_message "Paquete: $PACKAGE_NAME@$NEW_VERSION"
    print_message "URL: https://www.npmjs.com/package/$PACKAGE_NAME"
    
    # Hacer commit de la nueva versión si cambió
    if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
        print_step "💾 Haciendo commit de la nueva versión..."
        if git add package.json && git commit -m "chore: bump version to $NEW_VERSION"; then
            print_message "✅ Commit de versión realizado"
        fi
    fi
    
    # Hacer push de los cambios
    print_step "📤 Haciendo push..."
    if git push; then
        print_message "✅ Push realizado"
    else
        print_warning "⚠️ Error al hacer push, puedes hacerlo manualmente"
    fi
    
else
    print_error "❌ Error al publicar en npm"
    exit 1
fi

print_success "🎯 ¡Proceso completado exitosamente!"
print_message "Tu paquete está disponible en: https://www.npmjs.com/package/$PACKAGE_NAME" 