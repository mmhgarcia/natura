#!/bin/bash

# Script de instalación automática de Emscripten
# Este script descarga e instala Emscripten SDK

set -e

echo "🚀 Instalando Emscripten SDK..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar si ya está instalado
if command -v emcc &> /dev/null; then
    echo -e "${GREEN}✅ Emscripten ya está instalado${NC}"
    emcc --version
    exit 0
fi

# Directorio de instalación
INSTALL_DIR="$HOME/emsdk"

echo -e "${BLUE}📁 Directorio de instalación: $INSTALL_DIR${NC}"

# Verificar si el directorio ya existe
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠️  El directorio $INSTALL_DIR ya existe${NC}"
    read -p "¿Deseas eliminarlo y reinstalar? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        rm -rf "$INSTALL_DIR"
    else
        echo "Instalación cancelada"
        exit 1
    fi
fi

# Clonar repositorio
echo -e "${BLUE}📥 Descargando Emscripten SDK...${NC}"
git clone https://github.com/emscripten-core/emsdk.git "$INSTALL_DIR"

# Entrar al directorio
cd "$INSTALL_DIR"

# Instalar última versión
echo -e "${BLUE}⚙️  Instalando última versión...${NC}"
./emsdk install latest

# Activar
echo -e "${BLUE}✨ Activando Emscripten...${NC}"
./emsdk activate latest

# Configurar variables de entorno
echo -e "${BLUE}🔧 Configurando variables de entorno...${NC}"
source ./emsdk_env.sh

# Añadir a .bashrc si no está ya
if ! grep -q "emsdk_env.sh" "$HOME/.bashrc"; then
    echo "" >> "$HOME/.bashrc"
    echo "# Emscripten SDK" >> "$HOME/.bashrc"
    echo "source $INSTALL_DIR/emsdk_env.sh > /dev/null 2>&1" >> "$HOME/.bashrc"
    echo -e "${GREEN}✅ Añadido a ~/.bashrc${NC}"
fi

# Verificar instalación
echo ""
echo -e "${GREEN}🎉 Instalación completada!${NC}"
echo ""
echo -e "${BLUE}Versión instalada:${NC}"
emcc --version

echo ""
echo -e "${YELLOW}📝 Nota: Para usar emcc en esta sesión, ejecuta:${NC}"
echo -e "${YELLOW}   source ~/emsdk/emsdk_env.sh${NC}"
echo ""
echo -e "${GREEN}En nuevas terminales, emcc estará disponible automáticamente.${NC}"
