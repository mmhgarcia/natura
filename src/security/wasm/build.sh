#!/bin/bash

# Build script for compiling security.cpp to WebAssembly
# This script uses Emscripten to compile C++ code to WASM

set -e  # Exit on error

echo "🔧 Building Security Module (C++ → WASM)..."

# Check if emcc is available, if not try to source emsdk if it exists
if ! command -v emcc &> /dev/null; then
    if [ -f "$HOME/emsdk/emsdk_env.sh" ]; then
        echo "ℹ️  Emscripten not in PATH, attempting to source from $HOME/emsdk/emsdk_env.sh..."
        source "$HOME/emsdk/emsdk_env.sh" > /dev/null 2>&1
    fi
fi

# Final check for emcc
if ! command -v emcc &> /dev/null; then
    echo "❌ Error: Emscripten (emcc) not found!"
    echo "Please install Emscripten first:"
    echo "  sudo apt install emscripten"
    echo "Or if you have emsdk installed, make sure it is in your PATH."
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../../../public/wasm"
SOURCE_FILE="$SCRIPT_DIR/security.cpp"
OUTPUT_NAME="security"

echo -e "${BLUE}📁 Source: $SOURCE_FILE${NC}"
echo -e "${BLUE}📁 Output: $OUTPUT_DIR${NC}"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Compile with Emscripten
echo -e "${BLUE}⚙️  Compiling with Emscripten...${NC}"

emcc "$SOURCE_FILE" \
    -o "$OUTPUT_DIR/$OUTPUT_NAME.js" \
    -O3 \
    -s WASM=1 \
    -s EXPORTED_RUNTIME_METHODS='["cwrap", "ccall"]' \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="createSecurityModule" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ENVIRONMENT='web' \
    --bind

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Compilation successful!${NC}"
    echo -e "${GREEN}📦 Generated files:${NC}"
    ls -lh "$OUTPUT_DIR/$OUTPUT_NAME.js"
    ls -lh "$OUTPUT_DIR/$OUTPUT_NAME.wasm"
    
    # Show file sizes
    JS_SIZE=$(du -h "$OUTPUT_DIR/$OUTPUT_NAME.js" | cut -f1)
    WASM_SIZE=$(du -h "$OUTPUT_DIR/$OUTPUT_NAME.wasm" | cut -f1)
    echo -e "${GREEN}   JavaScript: $JS_SIZE${NC}"
    echo -e "${GREEN}   WebAssembly: $WASM_SIZE${NC}"
else
    echo -e "❌ Compilation failed!"
    exit 1
fi

echo -e "${GREEN}🎉 Build complete!${NC}"
