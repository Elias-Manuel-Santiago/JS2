/* Vista Crear — gestiona los dos paneles: crear números y subir archivo */

import { saveFile, fetchFiles } from "/modules/api.js";
import { downloadNumbers } from "/modules/download.js";
import { validateContent, MIN_NUMBERS, MAX_NUMBERS } from "/modules/validator.js";

// onSave: callback que se llama después de guardar para que el controlador refresque la lista lateral
export function initCreateView(onSave) {

  // Agrega .txt al nombre si el usuario no lo escribió
  function normalizarNombre(raw) {
    const nombre = raw.trim();
    return nombre.endsWith(".txt") ? nombre : nombre + ".txt";
  }

  // ── Panel izquierdo: crear números ───────────────────────────────────────

  const numbers     = []; // array en memoria que acumula los números ingresados
  const numberInput = document.getElementById("create-number-input");
  const addBtn      = document.getElementById("create-add-btn");
  const numberList  = document.getElementById("create-list");
  const countEl     = document.getElementById("create-count");
  const downloadBtn = document.getElementById("create-download-btn");
  const uploadBtn   = document.getElementById("create-upload-btn");
  const filenameInput = document.getElementById("create-filename");
  const errorMsg    = document.getElementById("create-error");

  // Vuelve a dibujar la lista y actualiza el estado (habilitado/deshabilitado) de todos los controles
  function render() {
    numberList.innerHTML = "";

    numbers.forEach((n, i) => {
      const li = document.createElement("li");
      li.className = "number-item";

      const label = document.createElement("span");
      label.textContent = n;

      // Botón de eliminación individual; al hacer click elimina el número del array y redibuja
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

    const listo     = numbers.length >= MIN_NUMBERS;  // hay suficientes números para guardar/descargar
    const puedeSumar = numbers.length < MAX_NUMBERS;  // todavía no se llegó al tope

    downloadBtn.disabled  = !listo;
    uploadBtn.disabled    = !listo;
    addBtn.disabled       = !puedeSumar || numberInput.value.trim() === "";
    numberInput.disabled  = !puedeSumar; // bloquea el input cuando se alcanzó el máximo

    // Limpia el mensaje de error cuando ya hay suficientes números o se vació la lista
    if (listo || numbers.length === 0) errorMsg.textContent = "";
  }

  // Lee el input, valida y agrega el número al array
  function agregarNumero() {
    const raw = numberInput.value.trim();
    if (raw === "") return;

    const n = Number(raw);
    if (!isFinite(n) || isNaN(n)) { errorMsg.textContent = "Ingresá un número válido."; return; }
    if (numbers.length >= MAX_NUMBERS) { errorMsg.textContent = `El máximo es ${MAX_NUMBERS} números.`; return; }

    errorMsg.textContent = "";
    numbers.push(n);
    numberInput.value = "";
    numberInput.focus(); // devuelve el foco al input para agilizar la carga de varios números
    render();
  }

  // Actualiza el estado del botón Agregar en tiempo real mientras el usuario escribe
  numberInput.addEventListener("input", () => {
    addBtn.disabled = numbers.length >= MAX_NUMBERS || numberInput.value.trim() === "";
  });

  addBtn.addEventListener("click", agregarNumero);
  // Permite confirmar con Enter además de hacer click
  numberInput.addEventListener("keydown", (e) => { if (e.key === "Enter") agregarNumero(); });

  downloadBtn.addEventListener("click", () => {
    // Si el usuario no puso nombre usa "numeros.txt" como nombre por defecto
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
    const textoOriginal = uploadBtn.textContent; // guarda el texto para restaurarlo luego

    try {
      uploadBtn.disabled    = true;
      uploadBtn.textContent = "Verificando…";
      // Consulta los archivos existentes antes de guardar para evitar sobreescrituras accidentales
      const existentes = await fetchFiles();
      if (existentes.includes(filename)) {
        errorMsg.textContent = `Ya existe "${filename}" en el servidor. Elegí otro nombre.`;
        return;
      }
      uploadBtn.textContent = "Subiendo…";
      await saveFile(filename, numbers);
      await onSave(); // refresca la lista lateral inmediatamente después de guardar
      errorMsg.textContent  = "";
      uploadBtn.textContent = "✓ Guardado!";
      // Mantiene el mensaje de confirmación visible 1.5 s antes de restaurar el botón
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      errorMsg.textContent = err.message;
    } finally {
      // Siempre restaura el botón aunque haya habido un error
      uploadBtn.disabled    = false;
      uploadBtn.textContent = textoOriginal;
    }
  });

  render(); // dibuja el estado inicial (lista vacía)

  // ── Panel derecho: subir archivo .txt desde el disco ─────────────────────

  let uploadNumbers    = []; // números parseados del archivo seleccionado por el usuario
  const uploadDropZone  = document.getElementById("upload-drop-zone");
  const uploadFileInput = document.getElementById("upload-file-input");
  const uploadBrowseBtn = document.getElementById("upload-browse-btn");
  const uploadFilename  = document.getElementById("upload-filename");
  const uploadValidation = document.getElementById("upload-validation");
  const uploadSubmitBtn  = document.getElementById("upload-submit-btn");

  // Lee y valida el archivo elegido; si es válido habilita el botón de subir
  function cargarArchivoParaSubir(file) {
    if (!file.name.endsWith(".txt")) {
      uploadValidation.textContent = "Solo se aceptan archivos .txt.";
      uploadSubmitBtn.disabled = true;
      return;
    }
    // FileReader lee el archivo de forma asíncrona; onload se dispara cuando termina
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = validateContent(e.target.result); // valida formato y rango de números
      if (!result.valid) {
        uploadValidation.textContent = `Formato inválido: ${result.error}`;
        uploadSubmitBtn.disabled = true;
        return;
      }
      uploadNumbers = result.numbers;
      // Precompleta el nombre de archivo con el del archivo seleccionado si el campo está vacío
      if (!uploadFilename.value.trim()) uploadFilename.value = file.name;
      uploadValidation.textContent = "";
      uploadSubmitBtn.disabled = false; // habilita el botón solo cuando el archivo es válido
    };
    reader.readAsText(file); // dispara la lectura; el resultado llega en onload
  }

  // Drag & drop: dragover previene el comportamiento por defecto (abrir el archivo en la tab)
  uploadDropZone.addEventListener("dragover",  (e) => { e.preventDefault(); uploadDropZone.classList.add("drag-over"); });
  uploadDropZone.addEventListener("dragleave", ()  => uploadDropZone.classList.remove("drag-over"));
  uploadDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadDropZone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0]; // solo procesa el primer archivo si se sueltan varios
    if (file) cargarArchivoParaSubir(file);
  });

  // El botón "Examinar" activa el input file oculto para abrir el explorador de archivos
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
      // Evita sobreescribir un archivo que ya existe en el servidor
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
      // Si no hay números válidos cargados, deja el botón deshabilitado al terminar
      uploadSubmitBtn.disabled    = uploadNumbers.length === 0;
      uploadSubmitBtn.textContent = textoOriginal;
    }
  });
}
