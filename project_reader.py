import os
import shutil
import sys
from pathlib import Path

# --- CONFIGURACIÓN DE EXCLUSIONES ---
IGNORE_DIRS = {
    '.git', 'node_modules', 'dist', 'build', '.next',
    '__pycache__', 'env', 'venv', '.idea', '.vscode'
}
IGNORE_FILES = {
    '.DS_Store', '.env', '.env.*', 'package-lock.json',
    'yarn.lock', 'pnpm-lock.yaml', '*.log', '*.pid'
}
ALLOWED_EXTENSIONS = {
    '.js', '.jsx', '.ts', '.tsx', '.css', '.scss',
    '.html', '.json', '.md', '.py', '.txt', '.yml', '.yaml'
}
MAX_FILE_SIZE = 1024 * 1024  # 1MB
SENSITIVE_PATTERNS = ['api_key', 'password', 'secret', 'token', 'auth']

def should_ignore(path: Path, root: Path) -> bool:
    """Determina si un archivo/directorio debe ser omitido."""
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

def sanitize_content(content: str, filepath: str) -> str:
    """Detecta y oculta líneas con patrones de datos sensibles."""
    lines = content.split('\n')
    sanitized = []
    for line in lines:
        lower_line = line.lower()
        if any(pattern in lower_line for pattern in SENSITIVE_PATTERNS):
            sanitized.append(f"[CONTENIDO SENSIBLE ELIMINADO EN: {filepath}]")
            continue
        sanitized.append(line)
    return '\n'.join(sanitized)

def count_words_in_file(filepath: str) -> int:
    """Cuenta el número total de palabras en el archivo generado."""
    try:
        path = Path(filepath)
        content = path.read_text(encoding='utf-8', errors='ignore')
        words = content.split()
        return len(words)
    except Exception as e:
        print(f"⚠️ No se pudo realizar el conteo de palabras: {e}")
        return 0

def generate_project_summary(root_path: Path, output_file: str):
    """Genera un archivo consolidado con la estructura y contenido del proyecto."""
    root = Path(root_path).resolve()
    output_path = Path(output_file).resolve()

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"ESTRUCTURA DEL PROYECTO: {root.name}\n")
        f.write("=" * 60 + "\n\n")
        
        f.write("--- ÁRBOL DE DIRECTORIOS ---\n")
        dir_structure = []
        file_contents = []
        
        for path in sorted(root.rglob('*')):
            if should_ignore(path, root) or path.resolve() == output_path:
                continue
            
            relative_path = path.relative_to(root)
            depth = len(relative_path.parts) - 1
            indent = '  ' * depth
            
            if path.is_dir():
                dir_structure.append(f"{indent}📁 {path.name}/")
            else:
                dir_structure.append(f"{indent}📄 {path.name}")
                
                try:
                    file_size = path.stat().st_size
                    if file_size > MAX_FILE_SIZE:
                        content_block = f"\nFILE: {relative_path}\n" + "-"*30 + \
                                        f"\n[ARCHIVO EXCEDE LÍMITE DE TAMAÑO: {file_size} bytes]\n"
                    else:
                        raw_content = path.read_text(encoding='utf-8', errors='ignore')
                        sanitized = sanitize_content(raw_content, path.name)
                        content_block = f"\nFILE: {relative_path}\n" + "-"*30 + f"\n{sanitized}\n"
                    
                    file_contents.append(content_block + "*"*60)
                except Exception as e:
                    file_contents.append(f"\n[ERROR procesando {relative_path}: {e}]\n" + "*"*60)
        
        f.write('\n'.join(dir_structure))
        f.write("\n\n" + "=" * 60 + "\n\n")
        f.write("--- CONTENIDO DE ARCHIVOS (SANITIZADO) ---\n")
        f.write('\n'.join(file_contents))

def copy_to_destination(source_name: str, destination_dir: str):
    """Copia el archivo generado a la carpeta compartida especificada."""
    source_path = Path(source_name).resolve()
    target_folder = Path(destination_dir)

    if not source_path.exists():
        print(f"❌ Error: El archivo fuente {source_name} no existe.")
        return

    if not target_folder.exists():
        print(f"⚠️ Aviso: La carpeta de destino '{destination_dir}' no existe o no está montada.")
        return

    try:
        final_destination = target_folder / source_name
        shutil.copy2(source_path, final_destination)
        print(f"🚀 Copia exitosa a: {final_destination}")
    except PermissionError:
        print(f"🚫 Error de permisos: No se pudo escribir en '{destination_dir}'.")
    except Exception as e:
        print(f"❌ Error durante la copia: {e}")

def main():
    current_dir = Path.cwd()
    output_filename = "proyecto_completo.txt"
    shared_folder = "/media/sf_sfPaleteria/natura/"

    print(f"🚀 Iniciando análisis en: {current_dir}")
    confirm = input("¿Desea proceder? (s/n): ").strip().lower()
    
    if confirm != 's':
        print("Operación abortada.")
        return

    try:
        # 1. Generar el resumen
        generate_project_summary(current_dir, output_filename)
        print(f"✅ Resumen generado: {output_filename}")
        
        # 2. Contar palabras (Nueva funcionalidad)
        word_count = count_words_in_file(output_filename)
        print("-" * 30)
        print(f"📊 ESTADÍSTICAS DEL ARCHIVO:")
        print(f"   Total de palabras: {word_count:,}/500.000")
        print("-" * 30)
        
        # 3. Copiar a destino
        print(f"📦 Copiando a carpeta compartida...")
        copy_to_destination(output_filename, shared_folder)
        
    except Exception as e:
        print(f"💥 Error crítico en la ejecución: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()