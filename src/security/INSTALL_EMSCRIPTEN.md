# Guía de Instalación de Emscripten

## ¿Qué es Emscripten?

Emscripten es un compilador que convierte código C/C++ a WebAssembly (WASM), permitiendo ejecutar código nativo en el navegador con rendimiento casi nativo.

## Instalación

### Opción 1: Usando emsdk (Recomendado)

```bash
# 1. Clonar el repositorio de emsdk
cd ~
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# 2. Instalar la última versión
./emsdk install latest

# 3. Activar la versión instalada
./emsdk activate latest

# 4. Configurar variables de entorno
source ./emsdk_env.sh

# 5. Verificar instalación
emcc --version
```

### Opción 2: Usando apt (puede tener problemas de dependencias)

```bash
sudo apt update
sudo apt install emscripten
```

**Nota**: Si encuentras errores de dependencias con apt, usa la Opción 1.

## Configurar Variables de Entorno Permanentemente

Para que Emscripten esté disponible en cada sesión de terminal:

```bash
# Añadir al final de ~/.bashrc
echo 'source ~/emsdk/emsdk_env.sh' >> ~/.bashrc

# Recargar configuración
source ~/.bashrc
```

## Compilar el Módulo de Seguridad

Una vez instalado Emscripten:

```bash
# Desde la raíz del proyecto Natura
cd /home/vboxuser/labs/natura

# Compilar el módulo WASM
npm run build:wasm
```

Esto generará:
- `public/wasm/security.js`
- `public/wasm/security.wasm`

## Verificar que Funciona

```bash
# Verificar que los archivos se generaron
ls -lh public/wasm/

# Deberías ver:
# security.js
# security.wasm
```

## Troubleshooting

### Error: "emcc: command not found"

**Solución**: Asegúrate de haber ejecutado `source ~/emsdk/emsdk_env.sh`

### Error: "Unable to correct problems, you have held broken packages"

**Solución**: Usa la Opción 1 (emsdk) en lugar de apt.

### Los archivos WASM no se generan

**Solución**: 
1. Verifica que el script tiene permisos de ejecución: `chmod +x src/security/wasm/build.sh`
2. Ejecuta manualmente: `cd src/security/wasm && ./build.sh`
3. Revisa los errores de compilación

## Próximos Pasos

Después de compilar exitosamente:

1. Ejecuta la aplicación: `npm run dev`
2. Abre la consola del navegador
3. Prueba los ejemplos: `import('./src/security/ejemplos.js').then(m => m.ejecutarEjemplos())`
