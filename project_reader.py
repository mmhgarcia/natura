import os
from pathlib import Path
import sys

# Configuración de exclusiones según las fuentes [4, 5]
IGNORE_DIRS = {'.git', 'node_modules', 'dist', 'build', '.next',
               '__pycache__', 'env', 'venv', '.idea', '.vscode'}
IGNORE_FILES = {'.DS_Store', '.env', '.env.*', 'package-lock.json',
                'yarn.lock', 'pnpm-lock.yaml', '*.log', '*.pid'}
ALLOWED_EXTENSIONS = {'.js', '.jsx', '.ts', '.tsx', '.css', '.scss',
                      '.html', '.json', '.md', '.py', '.txt', '.yml', '.yaml'}
MAX_FILE_SIZE = 1024 * 1024  # 1MB
SENSITIVE_PATTERNS = ['api_key', 'password', 'secret', 'token', 'auth'] # Definición necesaria [6, 7]

def should_ignore(path, root):
    """Determina si un archivo/directorio debe ser ignorado [8, 9]"""
    for part in path.parts:
        if part in IGNORE_DIRS:
            return True
    for pattern in IGNORE_FILES:
        if pattern.startswith('*') and path.name.endswith(pattern[1:]):
            return True
        elif path.name == pattern:
            return True
    if path.is_file() and path.suffix not in ALLOWED_EXTENSIONS:
        return True
    return False

def sanitize_content(content, filepath):
    """Elimina datos sensibles del contenido [6, 7]"""
    lines = content.split('\n')
    sanitized = []
    for line in lines:
        lower_line = line.lower()
        if any(pattern in lower_line for pattern in SENSITIVE_PATTERNS):
            sanitized.append(f"[CONTENIDO SENSIBLE ELIMINADO: {filepath}]")
            continue
        sanitized.append(line)
    return '\n'.join(sanitized)

def generate_project_summary(root_path, output_file):
    """Genera un resumen seguro del proyecto [1, 3]"""
    root = Path(root_path).resolve()
    
    # Asegurar que el directorio de destino exista (D:\NOTEBOOKLM\natura)
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"ESTRUCTURA DEL PROYECTO: {root.name}\n")
        f.write("=" * 50 + "\n\n")
        
        f.write("--- ÁRBOL DE DIRECTORIOS ---\n")
        dir_structure = []
        file_contents = []
        
        # Recorrido recursivo [10, 11]
        for path in sorted(root.rglob('*')):
            # Evitar leer el propio archivo de salida si está en el mismo root
            if should_ignore(path, root) or path.resolve() == output_path.resolve():
                continue
            
            depth = len(path.relative_to(root).parts) - 1
            indent = '  ' * depth
            if path.is_dir():
                dir_structure.append(f"{indent}📁 {path.name}/")
            else:
                dir_structure.append(f"{indent}📄 {path.name}")

            if path.is_file():
                try:
                    file_size = path.stat().st_size
                    if file_size > MAX_FILE_SIZE:
                        file_contents.append(f"\nFILE: {path.relative_to(root)}\n" + "-"*30 + 
                                           f"\n[ARCHIVO DEMASIADO GRANDE: {file_size} bytes]\n" + "*"*50)
                        continue
                    
                    content = path.read_text(encoding='utf-8', errors='ignore')
                    sanitized = sanitize_content(content, path.name)
                    file_contents.append(f"\nFILE: {path.relative_to(root)}\n" + "-"*30 + 
                                       f"\n{sanitized}\n" + "*"*50)
                except Exception as e:
                    file_contents.append(f"\n[ERROR leyendo {path.name}: {e}]")
        
        f.write('\n'.join(dir_structure))
        f.write("\n\n" + "=" * 50 + "\n\n")
        f.write("--- CONTENIDO DE ARCHIVOS (SANITIZADO) ---\n")
        f.write('\n'.join(file_contents))

def main():
    current_dir = Path.cwd()
    print(f"Directorio a analizar: {current_dir}")
    response = input("¿Continuar? (s/n): ").strip().lower()
    if response != 's':
        print("Operación cancelada")
        return

    # RUTA SOLICITADA: Uso de prefijo 'r' para evitar errores de escape en Windows
    output_filename = "proyecto_completo.txt"

    try:
        print(f"Analizando proyecto...")
        generate_project_summary(current_dir, output_filename)
        print(f"✓ Proceso finalizado. Resultado en: {output_filename}")
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()