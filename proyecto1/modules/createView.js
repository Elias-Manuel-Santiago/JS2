/* Vista Crear — gestiona los dos paneles: crear números y subir archivo */

import { saveFile, fetchFiles } from "/modules/api.js";
import { downloadNumbers } from "/modules/download.js";
import { validateContent, MIN_NUMBERS, MAX_NUMBERS } from "/modules/validator.js";

export function initCreateView(onSave) {

  // Agrega .txt al nombre si no lo tiene
  function normalizarNombre(raw) {
    const nombre = raw.trim();
    return nombre.endsWith(".txt") ? nombre : nombre + ".txt";
  }

  // ── Panel izquierdo: crear números ───────────────────────────────────────

  const numbers     = [];
  const numberInput = document.getElementById("create-number-input");
  const addBtn      = document.getElementById("create-add-btn");
  const numberList  = document.getElementById("create-list");
  const countEl     = document.getElementById("create-count");
  const downloadBtn = document.getElementById("create-download-btn");
  const uploadBtn   = document.getElementById("create-upload-btn");
  const filenameInput = document.getElementById("create-filename");
  const errorMsg    = document.getElementById("create-error");

  function render() {
    numberList.innerHTML = "";

    numbers.forEach((n, i) => {
      const li = document.createElement("li");
      li.className = "number-item";

      const label = document.createElement("span");
      label.textContent = n;

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn-small btn-danger";
      delBtn.textContent = "✕";
      delBtn.title = "Eliminar";
      delBtn.addEventListener("click", () => { numbers.splice(i, 1); render(); });

      li.append(label, delBtn);
      numberList.appendChild(li);
    });

    countEl.textContent = numbers.length;

    const listo     = numbers.length >= MIN_NUMBERS;
    const puedeSumar = numbers.length < MAX_NUMBERS;

    downloadBtn.disabled  = !listo;
    uploadBtn.disabled    = !listo;
    addBtn.disabled       = !puedeSumar || numberInput.value.trim() === "";
    numberInput.disabled  = !puedeSumar;

    if (listo || numbers.length === 0) errorMsg.textContent = "";
  }

  function agregarNumero() {
    const raw = numberInput.value.trim();
    if (raw === "") return;

    const n = Number(raw);
    if (!isFinite(n) || isNaN(n)) { errorMsg.textContent = "Ingresá un número válido."; return; }
    if (numbers.length >= MAX_NUMBERS) { errorMsg.textContent = `El máximo es ${MAX_NUMBERS} números.`; return; }

    errorMsg.textContent = "";
    numbers.push(n);
    numberInput.value = "";
    numberInput.focus();
    render();
  }

  numberInput.addEventListener("input", () => {
    addBtn.disabled = numbers.length >= MAX_NUMBERS || numberInput.value.trim() === "";
  });

  addBtn.addEventListener("click", agregarNumero);
  numberInput.addEventListener("keydown", (e) => { if (e.key === "Enter") agregarNumero(); });

  downloadBtn.addEventListener("click", () => {
    const filename = filenameInput.value.trim()
      ? normalizarNombre(filenameInput.value)
      : "numeros.txt";
    downloadNumbers(numbers, filename);
  });

  uploadBtn.addEventListener("click", async () => {
    if (numbers.length < MIN_NUMBERS) { errorMsg.textContent = `Agregá al menos ${MIN_NUMBERS} números primero.`; return; }

    const raw = filenameInput.value.trim();
    if (!raw) { errorMsg.textContent = "Ingresá un nombre de archivo antes de subir."; filenameInput.focus(); return; }

    const filename      = normalizarNombre(raw);
    const textoOriginal = uploadBtn.textContent;

    try {
      uploadBtn.disabled    = true;
      uploadBtn.textContent = "Verificando…";
      const existentes = await fetchFiles();
      if (existentes.includes(filename)) {
        errorMsg.textContent = `Ya existe "${filename}" en el servidor. Elegí otro nombre.`;
        return;
      }
      uploadBtn.textContent = "Subiendo…";
      await saveFile(filename, numbers);
      await onSave();
      errorMsg.textContent  = "";
      uploadBtn.textContent = "✓ Guardado!";
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      errorMsg.textContent = err.message;
    } finally {
      uploadBtn.disabled    = false;
      uploadBtn.textContent = textoOriginal;
    }
  });

  render();

  // ── Panel derecho: subir archivo .txt directo ─────────────────────────────

  let uploadNumbers    = [];
  const uploadDropZone  = document.getElementById("upload-drop-zone");
  const uploadFileInput = document.getElementById("upload-file-input");
  const uploadBrowseBtn = document.getElementById("upload-browse-btn");
  const uploadFilename  = document.getElementById("upload-filename");
  const uploadValidation = document.getElementById("upload-validation");
  const uploadSubmitBtn  = document.getElementById("upload-submit-btn");

  function cargarArchivoParaSubir(file) {
    if (!file.name.endsWith(".txt")) {
      uploadValidation.textContent = "Solo se aceptan archivos .txt.";
      uploadSubmitBtn.disabled = true;
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = validateContent(e.target.result);
      if (!result.valid) {
        uploadValidation.textContent = `Formato inválido: ${result.error}`;
        uploadSubmitBtn.disabled = true;
        return;
      }
      uploadNumbers = result.numbers;
      if (!uploadFilename.value.trim()) uploadFilename.value = file.name;
      uploadValidation.textContent = "";
      uploadSubmitBtn.disabled = false;
    };
    reader.readAsText(file);
  }

  uploadDropZone.addEventListener("dragover",  (e) => { e.preventDefault(); uploadDropZone.classList.add("drag-over"); });
  uploadDropZone.addEventListener("dragleave", ()  => uploadDropZone.classList.remove("drag-over"));
  uploadDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadDropZone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) cargarArchivoParaSubir(file);
  });

  uploadBrowseBtn.addEventListener("click", () => uploadFileInput.click());
  uploadFileInput.addEventListener("change", () => {
    const file = uploadFileInput.files[0];
    if (file) cargarArchivoParaSubir(file);
  });

  uploadSubmitBtn.addEventListener("click", async () => {
    const raw = uploadFilename.value.trim();
    if (!raw) { uploadValidation.textContent = "Ingresá un nombre de archivo."; uploadFilename.focus(); return; }

    const filename      = normalizarNombre(raw);
    const textoOriginal = uploadSubmitBtn.textContent;

    try {
      uploadSubmitBtn.disabled    = true;
      uploadSubmitBtn.textContent = "Verificando…";
      const existentes = await fetchFiles();
      if (existentes.includes(filename)) {
        uploadValidation.textContent = `Ya existe "${filename}" en el servidor. Elegí otro nombre.`;
        return;
      }
      uploadSubmitBtn.textContent = "Subiendo…";
      await saveFile(filename, uploadNumbers);
      await onSave();
      uploadValidation.textContent  = "";
      uploadSubmitBtn.textContent   = "✓ Guardado!";
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      uploadValidation.textContent = err.message;
    } finally {
      uploadSubmitBtn.disabled    = uploadNumbers.length === 0;
      uploadSubmitBtn.textContent = textoOriginal;
    }
  });
}
