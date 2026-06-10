/* Descarga de números como archivo .txt directamente en el browser, sin pasar por el servidor */

export function downloadNumbers(numbers, filename) {
    // Convierte el array a texto con un número por línea, igual al formato del servidor
    const contenido = numbers.join("\n");

    // Crea un objeto binario (Blob) en memoria con el texto plano
    const blob = new Blob([contenido], { type: "text/plain" });

    // Genera una URL temporal que apunta a ese Blob en memoria
    const url = URL.createObjectURL(blob);

    // Crea un enlace invisible, lo apunta a la URL del Blob y lo "clickea" para disparar la descarga
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; // el atributo download define el nombre del archivo descargado
    a.click();

    // Libera la URL temporal 1 segundo después para no acumular objetos en memoria
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
