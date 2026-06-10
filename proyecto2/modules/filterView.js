/* Vista Filtrar — carga un archivo, aplica el filtro y muestra los resultados */

import { fetchFileContent } from "/modules/api.js";
import { downloadNumbers } from "/modules/download.js";

// ── Lógica de filtrado ─────────────────────────────────────────────────────────

// Determina si un número es "pseudo-capicúa": su primer dígito es igual al último.
// Ignora caracteres no numéricos antes de comparar (ej: signo negativo, punto decimal).
function pseudoCapicua(num) {
    const digits = String(num).replace(/[^0-9]/g, ""); // Extrae solo los dígitos
    if (digits.length === 0) return false;
    return digits[0] === digits[digits.length - 1];
}

// Convierte el texto de un archivo en un array de números validados.
// Devuelve { valid, error, numbers } para que el llamador decida qué mostrar.
function parseContent(content) {
    // Divide el texto en líneas no vacías, eliminando espacios sobrantes
    const lines = content
        .trim()
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l !== "");

    if (lines.length === 0) {
        return { valid: false, error: "El archivo está vacío.", numbers: [] };
    }

    const numbers = [];
    for (let i = 0; i < lines.length; i++) {
        const n = Number(lines[i]);
        // Si alguna línea no es un número finito válido, aborta con el error de esa línea
        if (isNaN(n) || !isFinite(n)) {
            return {
                valid: false,
                error: `La línea ${i + 1} no es un número válido: "${lines[i]}"`,
                numbers: [],
            };
        }
        numbers.push(n);
    }
    return { valid: true, error: null, numbers };
}

// ── Inicialización de la vista ─────────────────────────────────────────────────

// Configura todos los elementos del DOM, registra los eventos y devuelve la API pública.
export function initFilterView() {
    // Guarda los números del archivo actualmente cargado para poder descargarlos luego
    let currentNumbers = [];

    // ── Panel izquierdo ───────────────────────────────────────────────────────

    const dropZone      = document.getElementById("filter-drop-zone");      // Área de arrastrar y soltar
    const fileInput     = document.getElementById("filter-file-input");      // Input file oculto
    const browseBtn     = document.getElementById("filter-browse-btn");      // Botón que abre el explorador
    const fileInfo      = document.getElementById("filter-file-info");       // Info del archivo cargado
    const fileInfoName  = document.getElementById("filter-file-name");       // Nombre del archivo cargado
    const fileInfoCount = document.getElementById("filter-file-count");      // Cantidad de números del archivo
    const resetBtn      = document.getElementById("filter-reset-btn");       // Botón para volver al estado inicial
    const validationMsg = document.getElementById("filter-validation");      // Mensajes de error de validación

    // ── Panel derecho ─────────────────────────────────────────────────────────

    const placeholder    = document.getElementById("results-placeholder");   // Mensaje "carga un archivo"
    const resultsPanel   = document.getElementById("results-panel");         // Panel con los resultados
    const statsUseful    = document.getElementById("stats-useful");          // Contador de números útiles
    const statsNotUseful = document.getElementById("stats-not-useful");      // Contador de números no útiles
    const statsPercent   = document.getElementById("stats-percent");         // Porcentaje de útiles
    const resultsList    = document.getElementById("results-list");          // Lista de números filtrados
    const downloadBtn    = document.getElementById("results-download-btn");  // Botón de descarga
    const filenameInput  = document.getElementById("results-filename");      // Campo con el nombre del archivo a descargar

    // ── Procesar y mostrar resultados ─────────────────────────────────────────

    // Aplica el filtro pseudo-capicúa, actualiza las estadísticas y renderiza la lista de resultados.
    function processAndDisplay(numbers, filename) {
        currentNumbers = numbers;

        // Separa los números en útiles (pseudo-capicúa, ordenados) y no útiles
        const useful    = numbers.filter(pseudoCapicua).sort((a, b) => a - b);
        const notUseful = numbers.filter((n) => !pseudoCapicua(n));
        // Calcula el porcentaje con un decimal; es "0.0" si el archivo está vacío
        const percentage =
            numbers.length > 0
                ? ((useful.length / numbers.length) * 100).toFixed(1)
                : "0.0";

        // Panel izquierdo: oculta el drop zone y muestra la info del archivo cargado
        dropZone.hidden   = true;
        fileInfo.hidden   = false;
        fileInfoName.textContent  = filename;
        fileInfoCount.textContent = numbers.length;

        // Panel derecho: oculta el placeholder y muestra el panel de resultados
        placeholder.hidden  = true;
        resultsPanel.hidden = false;

        // Actualiza las estadísticas de útiles, no útiles y porcentaje
        statsUseful.textContent    = useful.length;
        statsNotUseful.textContent = notUseful.length;
        statsPercent.textContent   = `${percentage}%`;

        // Limpia la lista anterior antes de renderizar los nuevos resultados
        resultsList.innerHTML = "";
        if (useful.length === 0) {
            // Muestra un mensaje especial si ningún número pasó el filtro
            const li = document.createElement("li");
            li.className = "number-item number-item-empty";
            const span = document.createElement("span");
            span.textContent = "Ningún número cumple el requisito.";
            li.appendChild(span);
            resultsList.appendChild(li);
        } else {
            // Crea un <li> por cada número útil
            useful.forEach((n) => {
                const li   = document.createElement("li");
                li.className = "number-item";
                const span = document.createElement("span");
                span.textContent = n;
                li.appendChild(span);
                resultsList.appendChild(li);
            });
        }

        // Sugiere un nombre de descarga basado en el nombre del archivo original
        const base = filename.endsWith(".txt") ? filename.slice(0, -4) : filename;
        filenameInput.value = `filtrado_${base}.txt`;
        validationMsg.textContent = "";
    }

    // ── Resetear vista ────────────────────────────────────────────────────────

    // Vuelve todos los elementos al estado inicial, como si no se hubiera cargado nada
    function resetView() {
        currentNumbers = [];
        dropZone.hidden   = false;
        fileInfo.hidden   = true;
        placeholder.hidden  = false;
        resultsPanel.hidden = true;
        fileInput.value     = ""; // Limpia el input para que se pueda volver a seleccionar el mismo archivo
        filenameInput.value = "";
        validationMsg.textContent = "";
    }

    // ── Cargar desde archivo local ────────────────────────────────────────────

    // Lee un archivo del sistema de archivos local usando FileReader y lo procesa
    function loadLocalFile(file) {
        if (!file.name.endsWith(".txt")) {
            validationMsg.textContent = "Solo se aceptan archivos .txt.";
            return;
        }
        const reader = new FileReader();
        // onload se ejecuta cuando FileReader termina de leer el archivo
        reader.onload = (e) => {
            const result = parseContent(e.target.result);
            if (!result.valid) {
                validationMsg.textContent = `Formato inválido: ${result.error}`;
                return;
            }
            processAndDisplay(result.numbers, file.name);
        };
        reader.readAsText(file); // Lee el archivo como texto UTF-8
    }

    // ── Cargar desde el servidor ──────────────────────────────────────────────

    // Descarga el contenido de un archivo del servidor y lo procesa
    async function loadFromServer(filename) {
        validationMsg.textContent = "";
        try {
            const content = await fetchFileContent(filename);
            const result  = parseContent(content);
            if (!result.valid) {
                validationMsg.textContent = `Archivo inválido: ${result.error}`;
                return;
            }
            processAndDisplay(result.numbers, filename);
        } catch {
            validationMsg.textContent = "No se pudo cargar el archivo desde el servidor.";
        }
    }

    // ── Drag & drop ───────────────────────────────────────────────────────────

    // preventDefault en dragover es obligatorio para habilitar el evento drop
    dropZone.addEventListener("dragover",  (e) => { e.preventDefault(); dropZone.classList.add("drag-over"); });
    // Elimina el estilo visual cuando el archivo sale del área sin soltarse
    dropZone.addEventListener("dragleave", ()  => dropZone.classList.remove("drag-over"));
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        // Toma solo el primer archivo si el usuario arrastra varios
        const file = e.dataTransfer.files[0];
        if (file) loadLocalFile(file);
    });

    // El botón "Examinar" abre el explorador de archivos activando el input oculto
    browseBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (file) loadLocalFile(file);
    });

    // ── Resetear ──────────────────────────────────────────────────────────────

    resetBtn.addEventListener("click", resetView);

    // ── Descargar resultado ───────────────────────────────────────────────────

    downloadBtn.addEventListener("click", () => {
        // Vuelve a filtrar y ordenar desde currentNumbers para asegurar consistencia
        const useful = currentNumbers
            .filter(pseudoCapicua)
            .sort((a, b) => a - b);

        // Usa el nombre del input; si está vacío usa "filtrado.txt" por defecto
        const raw      = filenameInput.value.trim() || "filtrado.txt";
        // Garantiza que el nombre siempre termine en .txt
        const filename = raw.endsWith(".txt") ? raw : raw + ".txt";

        downloadNumbers(useful, filename);
    });

    // Expone solo loadFromServer para que script.js pueda usarla al pulsar "Procesar"
    return { loadFromServer };
}
