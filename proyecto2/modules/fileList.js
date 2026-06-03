/* Renderiza la lista de archivos del servidor con botón Procesar */

import { fetchFiles } from "/modules/api.js";

export async function renderFileList(container, onProcess) {
    container.innerHTML = '<p class="loading">Cargando…</p>';

    let files;
    try {
        files = await fetchFiles();
    } catch {
        container.innerHTML = '<p class="error-msg">No se pudo cargar la lista de archivos.</p>';
        return;
    }

    const countBadge = document.getElementById("file-count");
    if (countBadge) countBadge.textContent = files.length > 0 ? files.length : "";

    if (files.length === 0) {
        container.innerHTML = '<p class="empty">No hay archivos disponibles.</p>';
        return;
    }

    container.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "file-list";

    for (const filename of files) {
        const li = document.createElement("li");
        li.className = "file-item";

        const nameEl = document.createElement("span");
        nameEl.className = "file-name";
        nameEl.textContent = filename;

        const actions = document.createElement("div");
        actions.className = "file-actions";

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
