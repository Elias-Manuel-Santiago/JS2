/* Todas las llamadas HTTP a la API del servidor */

// Devuelve un array de strings con los nombres de los .txt en el servidor
export async function fetchFiles() {
    const res = await fetch("/api/files");
    // Lanza un error si la respuesta HTTP no fue exitosa (status >= 400)
    if (!res.ok) throw new Error("No se pudo obtener la lista de archivos");
    return res.json(); // Parsea y devuelve el JSON con el array de nombres
}

// Devuelve el contenido de texto de un archivo guardado en el servidor
export async function fetchFileContent(filename) {
    // encodeURIComponent protege contra nombres con caracteres especiales en la URL
    const res = await fetch(`/api/files/${encodeURIComponent(filename)}`);
    if (!res.ok) throw new Error("No se pudo obtener el contenido del archivo");
    // Desestructura solo la propiedad "content" del objeto JSON devuelto por el servidor
    const { content } = await res.json();
    return content;
}
