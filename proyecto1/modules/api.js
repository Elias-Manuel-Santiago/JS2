/* Todas las llamadas HTTP a la API del servidor */

// Devuelve un array de strings con los nombres de los .txt almacenados en el servidor
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

// Crea o sobreescribe un archivo .txt con el array de números recibido
export async function saveFile(filename, numbers) {
    const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, numbers }),
    });
    if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "No se pudo guardar el archivo");
    }
    return res.json(); 
}

// Elimina permanentemente un archivo del servidor
export async function deleteFile(filename) {
    const res = await fetch(`/api/files/${encodeURIComponent(filename)}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("No se pudo eliminar el archivo");
    return res.json();
}
