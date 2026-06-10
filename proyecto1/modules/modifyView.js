/* Vista Modificar — toda la lógica está acotada a la sección #app > .panel */

import { saveFile, fetchFileContent, deleteFile } from "/modules/api.js";
import { downloadNumbers } from "/modules/download.js";
import { validateContent, MIN_NUMBERS, MAX_NUMBERS } from "/modules/validator.js";

// onSave: callback que el controlador usa para refrescar la lista lateral después de guardar
export function initModifyView(onSave) {
    let numbers = [];
    let currentFilename = null; // nombre que aparece en el input (puede haber sido editado por el usuario)
    let serverFilename = null;  // nombre real del archivo en el servidor (null si vino del disco local)

    // ── Referencias al DOM ────────────────────────────────────────────────────

    const dropZone = document.getElementById("modify-drop-zone");
    const fileInput = document.getElementById("modify-file-input");
    const browseBtn = document.getElementById("modify-browse-btn");
    const editor = document.getElementById("modify-editor");
    const numberList = document.getElementById("modify-list");
    const countEl = document.getElementById("modify-count");
    const newNumberInput = document.getElementById("modify-new-number");
    const addBtn = document.getElementById("modify-add-btn");
    const downloadBtn = document.getElementById("modify-download-btn");
    const uploadBtn = document.getElementById("modify-upload-btn");
    const resetBtn = document.getElementById("modify-reset-btn");
    const validationMsg = document.getElementById("modify-validation");
    const errorMsg = document.getElementById("modify-error");
    const filenameInput = document.getElementById("modify-filename");


    // ── Cargar desde el servidor ──────────────────────────────────────────────

    // Descarga el contenido del archivo, lo valida y abre el editor
    async function loadFromServer(filename) {
        validationMsg.textContent = "";
        try {
            const content = await fetchFileContent(filename);
            const result = validateContent(content);
            if (!result.valid) {
                validationMsg.textContent = `Archivo inválido: ${result.error}`;
                return;
            }
            numbers = result.numbers;
            currentFilename = filename;
            serverFilename = filename; // registra que este archivo ya existe en el servidor
            abrirEditor(filename);
        } catch {
            validationMsg.textContent = "No se pudo cargar el archivo desde el servidor.";
        }
    }

    // ── Cargar desde un archivo local (drag & drop o explorador) ─────────────

    function cargarArchivoLocal(file) {
        if (!file.name.endsWith(".txt")) {
            validationMsg.textContent = "Solo se aceptan archivos .txt.";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = validateContent(e.target.result);
            if (!result.valid) { validationMsg.textContent = `Formato inválido: ${result.error}`; return; }
            numbers = result.numbers;
            currentFilename = file.name;
            serverFilename = null; // vino del disco local: no existe en el servidor todavía
            validationMsg.textContent = "";
            abrirEditor(file.name);
        };
        reader.readAsText(file);
    }

    // Agrega .txt al nombre si no lo tiene
    function normalizarNombre(raw) {
        const nombre = raw.trim();
        return nombre.endsWith(".txt") ? nombre : nombre + ".txt";
    }

    // ── Abrir / cerrar editor ─────────────────────────────────────────────────

    // Oculta el drop zone y muestra el panel de edición con los números cargados
    function abrirEditor(filename) {
        dropZone.hidden = true;
        editor.hidden = false;
        filenameInput.value = filename;
        renderEditor();
    }

    // Restablece todo el estado y vuelve a mostrar el drop zone
    function cerrarEditor() {
        numbers = [];
        currentFilename = null;
        serverFilename = null;
        editor.hidden = true;
        dropZone.hidden = false;
        fileInput.value = "";
        filenameInput.value = "";
        validationMsg.textContent = "";
        errorMsg.textContent = "";
    }

    // ── Renderizado del editor ────────────────────────────────────────────────

    // Reconstruye la lista de inputs editables; se llama cada vez que cambia el array numbers
    function renderEditor() {
        numberList.innerHTML = "";

        numbers.forEach((n, i) => {
            const li = document.createElement("li");
            li.className = "number-item";

            // Input editable en línea; se confirma al perder el foco (evento "change")
            const input = document.createElement("input");
            input.type = "number";
            input.value = n;
            input.step = "any"; // permite decimales
            input.className = "number-edit-input";
            input.setAttribute("aria-label", `Número ${i + 1}`);
            input.addEventListener("change", () => {
                const val = input.valueAsNumber;
                if (isFinite(val) && !isNaN(val)) {
                    numbers[i] = val; // actualiza el array con el nuevo valor
                    errorMsg.textContent = "";
                } else {
                    numbers[i] = NaN; // marca la posición como inválida; el botón guardar lo detectará
                }
            });

            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "btn btn-small btn-danger";
            delBtn.textContent = "✕";
            delBtn.title = "Eliminar";
            // Impide bajar del mínimo requerido
            delBtn.disabled = numbers.length <= MIN_NUMBERS;
            delBtn.addEventListener("click", () => {
                numbers.splice(i, 1);
                errorMsg.textContent = "";
                renderEditor();
            });

            li.append(input, delBtn);
            numberList.appendChild(li);
        });

        countEl.textContent = numbers.length;
        addBtn.disabled = numbers.length >= MAX_NUMBERS || newNumberInput.value.trim() === "";
        newNumberInput.disabled = numbers.length >= MAX_NUMBERS;
    }

    // ── Agregar número mientras se edita ──────────────────────────────────────

    function agregarNumero() {
        const raw = newNumberInput.value.trim();
        if (raw === "") return;

        const n = Number(raw);
        if (!isFinite(n) || isNaN(n)) { errorMsg.textContent = "Ingresá un número válido."; return; }
        if (numbers.length >= MAX_NUMBERS) { errorMsg.textContent = `El máximo es ${MAX_NUMBERS} números.`; return; }

        numbers.push(n);
        newNumberInput.value = "";
        errorMsg.textContent = "";
        renderEditor();
    }

    newNumberInput.addEventListener("input", () => {
        addBtn.disabled = numbers.length >= MAX_NUMBERS || newNumberInput.value.trim() === "";
    });

    addBtn.addEventListener("click", agregarNumero);
    newNumberInput.addEventListener("keydown", (e) => { if (e.key === "Enter") agregarNumero(); });

    // ── Descargar ─────────────────────────────────────────────────────────────

    downloadBtn.addEventListener("click", () => {
        if (numbers.length < MIN_NUMBERS) { errorMsg.textContent = `Necesitás al menos ${MIN_NUMBERS} números para descargar.`; return; }
        // Prioriza el nombre del input; si está vacío usa el nombre original del archivo
        const filename = filenameInput.value.trim() ? normalizarNombre(filenameInput.value) : currentFilename || "modificado.txt";
        downloadNumbers(numbers, filename);
    });

    // ── Subir al servidor ─────────────────────────────────────────────────────

    uploadBtn.addEventListener("click", async () => {
        if (numbers.length < MIN_NUMBERS) { errorMsg.textContent = `Necesitás al menos ${MIN_NUMBERS} números.`; return; }
        if (numbers.length > MAX_NUMBERS) { errorMsg.textContent = `El máximo es ${MAX_NUMBERS} números.`; return; }
        // Detecta si algún input quedó con un valor inválido (NaN) después de edición manual
        if (!numbers.every((n) => typeof n === "number" && isFinite(n))) {
            errorMsg.textContent = "Hay números inválidos en la lista. Corregílos antes de guardar.";
            return;
        }

        const raw = filenameInput.value.trim();
        if (!raw) { errorMsg.textContent = "Ingresá un nombre de archivo antes de guardar."; filenameInput.focus(); return; }

        const filename = normalizarNombre(raw);
        const textoOriginal = uploadBtn.textContent;

        try {
            uploadBtn.disabled = true;
            uploadBtn.textContent = "Guardando…";
            await saveFile(filename, numbers); // crea o sobreescribe con el nuevo nombre
            // Si el usuario renombró el archivo, elimina el original del servidor para no dejar duplicados
            if (serverFilename && serverFilename !== filename) {
                await deleteFile(serverFilename);
            }
            currentFilename = filename;
            serverFilename = filename; // actualiza el nombre de referencia en el servidor
            await onSave();
            errorMsg.textContent = "";
            uploadBtn.textContent = "✓ Guardado!";
            await new Promise((r) => setTimeout(r, 1500));
        } catch (err) {
            errorMsg.textContent = err.message;
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = textoOriginal;
        }
    });

    // ── Reiniciar ─────────────────────────────────────────────────────────────

    // Vuelve al estado inicial para cargar un archivo diferente
    resetBtn.addEventListener("click", cerrarEditor);

    // ── Drag & drop ───────────────────────────────────────────────────────────

    dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drag-over"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        if (file) cargarArchivoLocal(file);
    });

    // ── Explorador de archivos ────────────────────────────────────────────────

    browseBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (file) cargarArchivoLocal(file);
    });

    // Expone loadFromServer para que el controlador pueda invocarla desde la barra lateral
    return { loadFromServer };
}
