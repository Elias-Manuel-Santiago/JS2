/* Todas las llamadas HTTP a la API del servidor */

// Devuelve un array de strings con los nombres de los .txt en el servidor
export async function fetchFiles() {
    const res = await fetch("/api/files");
    if (!res.ok) throw new Error("No se pudo obtener la lista de archivos");
    return res.json();
}

// Devuelve el contenido de texto de un archivo guardado en el servidor
export async function fetchFileContent(filename) {
    const res = await fetch(`/api/files/${encodeURIComponent(filename)}`);
    if (!res.ok) throw new Error("No se pudo obtener el contenido del archivo");
    const { content } = await res.json();
    return content;
}
