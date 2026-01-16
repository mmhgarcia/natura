import os
from pathlib import Path
import sys

# Configuración mejorada
IGNORE_DIRS = {'.git', 'node_modules', 'dist', 'build', '.next', 
               '__pycache__', 'env', 'venv', '.idea', '.vscode'}
IGNORE_FILES = {'.DS_Store', '.env', '.env.*', 'package-lock.json', 
                'yarn.lock', 'pnpm-lock.yaml', '*.log', '*.pid'}
ALLOWED_EXTENSIONS = {'.js', '.jsx', '.ts', '.tsx', '.css', '.scss', 
                      '.html', '.json', '.md', '.py', '.txt', '.yml', '.yaml'}
MAX_FILE_SIZE = 1024 * 1024  # 1MB máximo por archivo
SENSITIVE_PATTERNS = ['password', 'secret', 'token', 'key', 'api_key']

def should_ignore(path, root):
    """Determina si un archivo/directorio debe ser ignorado"""
    rel_path = path.relative_to(root)
    
    # Ignorar directorios completos
    for part in path.parts:
        if part in IGNORE_DIRS:
            return True
    
    # Ignorar archivos específicos y patrones
    for pattern in IGNORE_FILES:
        if pattern.startswith('*') and path.name.endswith(pattern[1:]):
            return True
        elif path.name == pattern:
            return True
    
    # Verificar extensión permitida solo para archivos
    if path.is_file() and path.suffix not in ALLOWED_EXTENSIONS:
        return True
    
    return False

def sanitize_content(content, filepath):
    """Elimina datos sensibles del contenido"""
    lines = content.split('\n')
    sanitized = []
    
    for line in lines:
        # Filtrar líneas que parecen contener datos sensibles
        lower_line = line.lower()
        if any(pattern in lower_line for pattern in SENSITIVE_PATTERNS):
            sanitized.append(f"[CONTENIDO SENSIBLE ELIMINADO: {filepath}]")
            continue
        
        # Filtrar URLs con tokens
        if '://' in line and ('token=' in line or 'key=' in line):
            sanitized.append(f"[URL CON TOKEN ELIMINADA: {filepath}]")
            continue
        
        sanitized.append(line)
    
    return '\n'.join(sanitized)

def generate_project_summary(root_path, output_file):
    """Genera un resumen seguro del proyecto"""
    root = Path(root_path).resolve()
    
    # Validar que el directorio existe y es accesible
    if not root.exists() or not root.is_dir():
        raise ValueError(f"Directorio inválido: {root_path}")
    
    # Prevenir path traversal
    try:
        root.relative_to(Path.cwd())
    except ValueError:
        print("Error: Directorio fuera del directorio actual no permitido")
        return
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"ESTRUCTURA DEL PROYECTO: {root.name}\n")
        f.write("=" * 50 + "\n\n")
        
        # Usar un solo recorrido eficiente
        f.write("--- ÁRBOL DE DIRECTORIOS ---\n")
        dir_structure = []
        file_contents = []
        
        for path in sorted(root.rglob('*')):
            if should_ignore(path, root):
                continue
            
            # Construir árbol
            depth = len(path.relative_to(root).parts) - 1
            indent = '  ' * depth
            if path.is_dir():
                dir_structure.append(f"{indent} {path.name}/")
            else:
                dir_structure.append(f"{indent} {path.name}")
                
                # Procesar contenido del archivo
                try:
                    # Verificar tamaño del archivo
                    file_size = path.stat().st_size
                    if file_size > MAX_FILE_SIZE:
                        file_contents.append(f"\nFILE: {path.relative_to(root)}")
                        file_contents.append("-" * 30)
                        file_contents.append(f"[ARCHIVO DEMASIADO GRANDE: {file_size} bytes]")
                        file_contents.append("*" * 50)
                        continue
                    
                    # Leer contenido con manejo de encoding
                    content = path.read_text(encoding='utf-8', errors='ignore')
                    
                    # Sanitizar contenido
                    sanitized = sanitize_content(content, path.name)
                    
                    file_contents.append(f"\nFILE: {path.relative_to(root)}")
                    file_contents.append("-" * 30)
                    file_contents.append(sanitized)
                    file_contents.append("*" * 50)
                    
                except UnicodeDecodeError:
                    file_contents.append(f"\nFILE: {path.relative_to(root)}")
                    file_contents.append("-" * 30)
                    file_contents.append("[ARCHIVO BINARIO O CON CODIFICACIÓN NO SOPORTADA]")
                    file_contents.append("*" * 50)
                except Exception as e:
                    file_contents.append(f"\n[ERROR leyendo {path.name}: {e}]")
        
        # Escribir estructura
        f.write('\n'.join(dir_structure))
        f.write("\n\n" + "=" * 50 + "\n\n")
        
        # Escribir contenido
        f.write("--- CONTENIDO DE ARCHIVOS (SANITIZADO) ---\n")
        f.write('\n'.join(file_contents))

def main():
    """Función principal con validaciones"""
    # Limitar a directorio actual por defecto
    current_dir = Path.cwd()
    
    # Solicitar confirmación para proyectos grandes
    print(f"Directorio a analizar: {current_dir}")
    response = input("¿Continuar? (s/n): ").strip().lower()
    
    if response != 's':
        print("Operación cancelada")
        return
    
    output_filename = "proyecto_completo.txt"
    
    try:
        print(f"Analizando proyecto en: {current_dir}...")
        generate_project_summary(current_dir, output_filename)
        print(f"✓ Proceso finalizado. Resultado en: {output_filename}")
        print("✓ Contenido sanitizado: se eliminaron datos sensibles")
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()