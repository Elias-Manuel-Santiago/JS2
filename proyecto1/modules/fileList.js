/* Renderiza la lista de archivos del servidor y conecta los botones de acción.
   Usada tanto en la vista Crear como en la vista Modificar. */

import { fetchFiles, deleteFile } from "/modules/api.js";

// Reemplaza el contenido de `container` con la lista actualizada de archivos del servidor.
// onModify: callback(filename) que se llama al hacer click en "Modificar"
// onRefresh: callback sin parámetros que se llama tras borrar un archivo
export async function renderFileList(container, onModify, onRefresh) {
    // Muestra un indicador de carga mientras llega la respuesta del servidor
    container.innerHTML = '<p class="loading">Cargando…</p>';

    let files;
    try {
        files = await fetchFiles(); // pide la lista de nombres de archivos al servidor
    } catch {
        container.innerHTML = '<p class="error-msg">No se pudo cargar la lista de archivos.</p>';
        return;
    }

    // Actualiza el badge numérico en el encabezado del aside; se oculta si no hay archivos
    const countBadge = document.getElementById("file-count");
    if (countBadge) countBadge.textContent = files.length > 0 ? files.length : "";

    if (files.length === 0) {
        container.innerHTML = '<p class="empty">Todavía no hay archivos guardados.</p>';
        return;
    }

    // Construye la lista de archivos dinámicamente
    container.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "file-list";

    for (const filename of files) {
        const li = document.createElement("li");
        li.className = "file-item";

        // Nombre del archivo (puede hacer wrapping si es largo)
        const nameEl = document.createElement("span");
        nameEl.className = "file-name";
        nameEl.textContent = filename;

        // Contenedor para agrupar los tres botones de acción
        const actions = document.createElement("div");
        actions.className = "file-actions";

        // Botón descargar: usa un <a> con atributo download para forzar la descarga directa
        const downloadLink = document.createElement("a");
        downloadLink.href = `/files/${encodeURIComponent(filename)}`;
        downloadLink.download = filename;
        downloadLink.className = "btn btn-small";
        downloadLink.textContent = "Descargar";

        // Botón modificar: si hay callback lo usa; si no, redirige a la página de modificar
        const modifyBtn = document.createElement("button");
        modifyBtn.className = "btn btn-small";
        modifyBtn.textContent = "Modificar";
        modifyBtn.addEventListener("click", () => {
            if (onModify) {
                onModify(filename); // modo SPA: carga el archivo en la vista sin recargar la página
            } else {
                window.location.href = `/modificar?file=${encodeURIComponent(filename)}`; // modo multipágina
            }
        });

        // Botón eliminar: borra el archivo del servidor y vuelve a renderizar la lista
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-small btn-danger";
        deleteBtn.textContent = "Eliminar";
        deleteBtn.addEventListener("click", async () => {
            await deleteFile(filename);
            await renderFileList(container, onModify, onRefresh); // re-renderiza para reflejar el cambio
            if (onRefresh) onRefresh(); // notifica al controlador padre si necesita reaccionar
        });

        actions.append(downloadLink, modifyBtn, deleteBtn);
        li.append(nameEl, actions);
        ul.appendChild(li);
    }

    container.appendChild(ul);
}
