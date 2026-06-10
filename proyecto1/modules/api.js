/* Todas las llamadas HTTP a la API del servidor */

// Devuelve un array de strings con los nombres de los .txt almacenados en el servidor
export async function fetchFiles() {
    const res = await fetch("/api/files");
    // res.ok es true cuando el código HTTP está entre 200–299
    if (!res.ok) throw new Error("No se pudo obtener la lista de archivos");
    return res.json(); // parsea el JSON de la respuesta y lo devuelve como array
}

// Devuelve el contenido de texto de un archivo guardado en el servidor
export async function fetchFileContent(filename) {
    // encodeURIComponent convierte caracteres especiales (espacios, ñ, etc.) a formato seguro para URL
    const res = await fetch(`/api/files/${encodeURIComponent(filename)}`);
    if (!res.ok) throw new Error("No se pudo obtener el contenido del archivo");
    const { content } = await res.json(); // desestructura el objeto { content } que devuelve el servidor
    return content;
}

// Crea o sobreescribe un archivo .txt con el array de números recibido
export async function saveFile(filename, numbers) {
    const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // le indica al servidor que el body es JSON
        body: JSON.stringify({ filename, numbers }),      // serializa el objeto a texto JSON para enviarlo
    });
    if (!res.ok) {
        // En caso de error el servidor devuelve { error: "..." }; lo propagamos como excepción
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
