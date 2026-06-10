/* Vista Filtrar — carga un archivo, aplica el filtro y muestra los resultados */

import { fetchFileContent } from "/modules/api.js";
import { downloadNumbers } from "/modules/download.js";

// ── Lógica de filtrado ─────────────────────────────────────────────────────────

function pseudoCapicua(num) {
    const digits = String(num).replace(/[^0-9]/g, "");
    if (digits.length === 0) return false;
    return digits[0] === digits[digits.length - 1];
}

function parseContent(content) {
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

export function initFilterView() {
    let currentNumbers = [];

    // ── Panel izquierdo ───────────────────────────────────────────────────────

    const dropZone      = document.getElementById("filter-drop-zone");
    const fileInput     = document.getElementById("filter-file-input");
    const browseBtn     = document.getElementById("filter-browse-btn");
    const fileInfo      = document.getElementById("filter-file-info");
    const fileInfoName  = document.getElementById("filter-file-name");
    const fileInfoCount = document.getElementById("filter-file-count");
    const resetBtn      = document.getElementById("filter-reset-btn");
    const validationMsg = document.getElementById("filter-validation");

    // ── Panel derecho ─────────────────────────────────────────────────────────

    const placeholder    = document.getElementById("results-placeholder");
    const resultsPanel   = document.getElementById("results-panel");
    const statsUseful    = document.getElementById("stats-useful");
    const statsNotUseful = document.getElementById("stats-not-useful");
    const statsPercent   = document.getElementById("stats-percent");
    const resultsList    = document.getElementById("results-list");
    const downloadBtn    = document.getElementById("results-download-btn");
    const filenameInput  = document.getElementById("results-filename");

    // ── Procesar y mostrar resultados ─────────────────────────────────────────

    function processAndDisplay(numbers, filename) {
        currentNumbers = numbers;

        const useful    = numbers.filter(pseudoCapicua).sort((a, b) => a - b);
        const notUseful = numbers.filter((n) => !pseudoCapicua(n));
        const percentage =
            numbers.length > 0
                ? ((useful.length / numbers.length) * 100).toFixed(1)
                : "0.0";

        // Panel izquierdo: mostrar info del archivo
        dropZone.hidden   = true;
        fileInfo.hidden   = false;
        fileInfoName.textContent  = filename;
        fileInfoCount.textContent = numbers.length;

        // Panel derecho: mostrar resultados
        placeholder.hidden  = true;
        resultsPanel.hidden = false;

        statsUseful.textContent    = useful.length;
        statsNotUseful.textContent = notUseful.length;
        statsPercent.textContent   = `${percentage}%`;

        resultsList.innerHTML = "";
        if (useful.length === 0) {
            const li = document.createElement("li");
            li.className = "number-item number-item-empty";
            const span = document.createElement("span");
            span.textContent = "Ningún número cumple el requisito.";
            li.appendChild(span);
            resultsList.appendChild(li);
        } else {
            useful.forEach((n) => {
                const li   = document.createElement("li");
                li.className = "number-item";
                const span = document.createElement("span");
                span.textContent = n;
                li.appendChild(span);
                resultsList.appendChild(li);
            });
        }

        const base = filename.endsWith(".txt") ? filename.slice(0, -4) : filename;
        filenameInput.value = `filtrado_${base}.txt`;
        validationMsg.textContent = "";
    }

    // ── Resetear vista ────────────────────────────────────────────────────────

    function resetView() {
        currentNumbers = [];
        dropZone.hidden   = false;
        fileInfo.hidden   = true;
        placeholder.hidden  = false;
        resultsPanel.hidden = true;
        fileInput.value     = "";
        filenameInput.value = "";
        validationMsg.textContent = "";
    }

    // ── Cargar desde archivo local ────────────────────────────────────────────

    function loadLocalFile(file) {
        if (!file.name.endsWith(".txt")) {
            validationMsg.textContent = "Solo se aceptan archivos .txt.";
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = parseContent(e.target.result);
            if (!result.valid) {
                validationMsg.textContent = `Formato inválido: ${result.error}`;
                return;
            }
            processAndDisplay(result.numbers, file.name);
        };
        reader.readAsText(file);
    }

    // ── Cargar desde el servidor ──────────────────────────────────────────────

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

    dropZone.addEventListener("dragover",  (e) => { e.preventDefault(); dropZone.classList.add("drag-over"); });
    dropZone.addEventListener("dragleave", ()  => dropZone.classList.remove("drag-over"));
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        if (file) loadLocalFile(file);
    });

    browseBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (file) loadLocalFile(file);
    });

    // ── Resetear ──────────────────────────────────────────────────────────────

    resetBtn.addEventListener("click", resetView);

    // ── Descargar resultado ───────────────────────────────────────────────────

    downloadBtn.addEventListener("click", () => {
        const useful = currentNumbers
            .filter(pseudoCapicua)
            .sort((a, b) => a - b);

        const raw      = filenameInput.value.trim() || "filtrado.txt";
        const filename = raw.endsWith(".txt") ? raw : raw + ".txt";

        downloadNumbers(useful, filename);
    });

    return { loadFromServer };
}
