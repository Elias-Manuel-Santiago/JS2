
export function downloadNumbers(numbers, filename) {
    const contenido = numbers.join("\n");
    const blob      = new Blob([contenido], { type: "text/plain" });
    const url       = URL.createObjectURL(blob);

    const a      = document.createElement("a");
    a.href       = url;
    a.download   = filename;
    a.click();

    // Liberar la URL de objeto una vez procesado el click
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
