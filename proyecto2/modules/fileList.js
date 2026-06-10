/* Renderiza la lista de archivos del servidor con botón Procesar */

import { fetchFiles } from "/modules/api.js";

// Pide la lista de archivos al servidor y construye el HTML de la lista en `container`.
// `onProcess` es el callback que se ejecuta al presionar "Procesar" con el nombre del archivo.
export async function renderFileList(container, onProcess) {
    // Muestra un indicador de carga mientras se espera la respuesta del servidor
    container.innerHTML = '<p class="loading">Cargando…</p>';

    let files;
    try {
        files = await fetchFiles(); // Llama a la API para obtener los nombres de archivos
    } catch {
        // Si la petición falla, muestra un mensaje de error y sale de la función
        container.innerHTML = '<p class="error-msg">No se pudo cargar la lista de archivos.</p>';
        return;
    }

    // Actualiza el badge con la cantidad de archivos (vacío si no hay ninguno)
    const countBadge = document.getElementById("file-count");
    if (countBadge) countBadge.textContent = files.length > 0 ? files.length : "";

    if (files.length === 0) {
        container.innerHTML = '<p class="empty">No hay archivos disponibles.</p>';
        return;
    }

    // Limpia el contenido previo del contenedor antes de renderizar la lista
    container.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "file-list";

    // Por cada archivo crea un <li> con el nombre y un botón "Procesar"
    for (const filename of files) {
        const li = document.createElement("li");
        li.className = "file-item";

        // Span que muestra el nombre del archivo
        const nameEl = document.createElement("span");
        nameEl.className = "file-name";
        nameEl.textContent = filename;

        // Contenedor de acciones (actualmente solo el botón Procesar)
        const actions = document.createElement("div");
        actions.className = "file-actions";

        // Botón que llama a onProcess con el nombre del archivo al hacer clic
        const processBtn = document.createElement("button");
        processBtn.className = "btn btn-small btn-primary";
        processBtn.textContent = "Procesar";
        processBtn.addEventListener("click", () => {
            if (onProcess) onProcess(filename);
        });

        actions.append(processBtn);
        li.append(nameEl, actions);
        ul.appendChild(li);
    }

    container.appendChild(ul);
}
