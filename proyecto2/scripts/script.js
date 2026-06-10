import { renderFileList } from "/modules/fileList.js";
import { initFilterView } from "/modules/filterView.js";

const listaArchivosEl = document.getElementById("lista-archivos");

// ── Cambio de tema ─────────────────────────────────────────────────────────────

const temaSistema = window.matchMedia("(prefers-color-scheme: dark)");
if (temaSistema.matches) {
    document.body.classList.toggle("dark");
}

document.getElementById("toggle-tema").addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// ── Inicialización ─────────────────────────────────────────────────────────────

const { loadFromServer } = initFilterView();

renderFileList(listaArchivosEl, (filename) => loadFromServer(filename));
