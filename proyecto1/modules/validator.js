/* Validación del contenido de archivos .txt de números */

// Límites compartidos con el servidor para que la UI rechace archivos inválidos antes de enviarlos
export const MIN_NUMBERS = 10;
export const MAX_NUMBERS = 20;

// Parsea y valida el texto de un archivo .txt; devuelve { valid, error, numbers }
export function validateContent(content) {
    // Separa el texto en líneas, descartando espacios extra y líneas vacías
    const lineas = content
        .trim()
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l !== "");

    // Verifica que la cantidad de líneas esté dentro del rango permitido
    if (lineas.length < MIN_NUMBERS || lineas.length > MAX_NUMBERS) {
        return {
            valid: false,
            error: `El archivo debe contener entre ${MIN_NUMBERS} y ${MAX_NUMBERS} números (se encontraron ${lineas.length})`,
            numbers: [],
        };
    }

    // Convierte cada línea a número y rechaza cualquier valor no numérico
    const numbers = [];
    for (let i = 0; i < lineas.length; i++) {
        const n = Number(lineas[i]);
        if (isNaN(n) || !isFinite(n)) {
            return {
                valid: false,
                error: `La línea ${i + 1} no es un número válido: "${lineas[i]}"`,
                numbers: [],
            };
        }
        numbers.push(n);
    }

    // Todos los valores son válidos; devuelve el array listo para usar
    return { valid: true, error: null, numbers };
}
