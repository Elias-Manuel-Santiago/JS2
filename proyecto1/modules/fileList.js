/* Renderiza la lista de archivos del servidor y conecta los botones de acción.
   Usada tanto en la vista Crear como en la vista Modificar. */

import { fetchFiles, deleteFile } from "/modules/api.js";

export async function renderFileList(container, onModify, onRefresh) {
    container.innerHTML = '<p class="loading">Cargando…</p>';

    let files;
    try {
        files = await fetchFiles();
    } catch {
        container.innerHTML = '<p class="error-msg">No se pudo cargar la lista de archivos.</p>';
        return;
    }

    // Actualiza el badge de conteo en el encabezado del aside
    const countBadge = document.getElementById("file-count");
    if (countBadge) countBadge.textContent = files.length > 0 ? files.length : "";

    if (files.length === 0) {
        container.innerHTML = '<p class="empty">Todavía no hay archivos guardados.</p>';
        return;
    }

    container.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "file-list";

    for (const filename of files) {
        const li = document.createElement("li");
        li.className = "file-item";

        // Nombre del archivo (ocupa el ancho completo, puede hacer wrapping)
        const nameEl = document.createElement("span");
        nameEl.className = "file-name";
        nameEl.textContent = filename;

        // Fila de acciones
        const actions = document.createElement("div");
        actions.className = "file-actions";

        // Descargar
        const downloadLink = document.createElement("a");
        downloadLink.href = `/files/${encodeURIComponent(filename)}`;
        downloadLink.download = filename;
        downloadLink.className = "btn btn-small";
        downloadLink.textContent = "Descargar";

        // Modificar
        const modifyBtn = document.createElement("button");
        modifyBtn.className = "btn btn-small";
        modifyBtn.textContent = "Modificar";
        modifyBtn.addEventListener("click", () => {
            if (onModify) {
                onModify(filename);
            } else {
                window.location.href = `/modificar?file=${encodeURIComponent(filename)}`;
            }
        });

        // Eliminar
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-small btn-danger";
        deleteBtn.textContent = "Eliminar";
        deleteBtn.addEventListener("click", async () => {
            await deleteFile(filename);
            await renderFileList(container, onModify, onRefresh);
            if (onRefresh) onRefresh();

        });

        actions.append(downloadLink, modifyBtn, deleteBtn);
        li.append(nameEl, actions);
        ul.appendChild(li);
    }

    container.appendChild(ul);
}
