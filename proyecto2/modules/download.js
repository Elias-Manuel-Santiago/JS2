// Genera un archivo .txt con los números y lo descarga en el navegador del usuario
export function downloadNumbers(numbers, filename) {
    // Une todos los números separados por salto de línea para formar el contenido del archivo
    const contenido = numbers.join("\n");
    // Crea un objeto Blob de texto plano con ese contenido
    const blob      = new Blob([contenido], { type: "text/plain" });
    // Genera una URL temporal en memoria que apunta al Blob
    const url       = URL.createObjectURL(blob);

    // Crea un enlace <a> invisible, asigna la URL y el nombre del archivo, y simula un clic
    const a      = document.createElement("a");
    a.href       = url;
    a.download   = filename;
    a.click();

    // Libera la URL temporal después de 1 segundo para no ocupar memoria innecesariamente
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
