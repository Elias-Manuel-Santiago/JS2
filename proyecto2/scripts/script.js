// Módulos propios que manejan la lista de archivos y la vista de filtrado
import { renderFileList } from "/modules/fileList.js";
import { initFilterView } from "/modules/filterView.js";

// Contenedor del DOM donde se inyectará la lista de archivos
const listaArchivosEl = document.getElementById("lista-archivos");

// ── Cambio de tema ─────────────────────────────────────────────────────────────

// Detecta si el sistema operativo tiene modo oscuro activo
const temaSistema = window.matchMedia("(prefers-color-scheme: dark)");
if (temaSistema.matches) {
    // Aplica la clase "dark" al body si el SO usa modo oscuro
    document.body.classList.toggle("dark");
}

// Botón que alterna manualmente entre modo claro y oscuro
document.getElementById("toggle-tema").addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// ── Inicialización ─────────────────────────────────────────────────────────────

// Inicializa la vista de filtrado y expone la función para cargar archivos desde el servidor
const { loadFromServer } = initFilterView();

// Renderiza la lista de archivos; al presionar "Procesar" llama a loadFromServer con el nombre del archivo
renderFileList(listaArchivosEl, (filename) => loadFromServer(filename));
