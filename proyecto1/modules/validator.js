/* Valida el formato del archivo de números:
   - Entre MIN y MAX líneas
   - Cada línea debe ser un número finito (entero o decimal)
   - Las líneas vacías se ignoran al contar
*/

export const MIN_NUMBERS = 10;
export const MAX_NUMBERS = 20;

export function validateContent(content) {
    const lineas = content
        .trim()
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l !== "");

    if (lineas.length < MIN_NUMBERS || lineas.length > MAX_NUMBERS) {
        return {
            valid: false,
            error: `El archivo debe contener entre ${MIN_NUMBERS} y ${MAX_NUMBERS} números (se encontraron ${lineas.length})`,
            numbers: [],
        };
    }

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

    return { valid: true, error: null, numbers };
}
