/* Controlador principal de la SPA */

import { renderFileList } from "/modules/fileList.js";
import { initFilterView } from "/modules/filterView.js";

// ── Referencias ────────────────────────────────────────────────────────────────

const app             = document.getElementById("app");
const appLayout       = document.querySelector(".app-layout");
const navBtns         = document.querySelectorAll(".nav-btn");
const listaArchivosEl = document.getElementById("lista-archivos");

let filterLoadFromServer = null;
let vistaActual          = null;

// ── Cambio de tema ─────────────────────────────────────────────────────────────

const temaSistema = window.matchMedia("(prefers-color-scheme: dark)");
if (temaSistema.matches) {
    document.body.classList.toggle("dark");
}

const toggleTema = document.getElementById("toggle-tema");
toggleTema.addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// ── Carga de vistas ────────────────────────────────────────────────────────────

async function cargarVista(nombre) {
    localStorage.setItem("vistaActual", nombre);
    vistaActual = nombre;

    const res = await fetch(`/views/${nombre}.html`);
    app.innerHTML = await res.text();

    navBtns.forEach((btn) => {
        const esActivo = btn.dataset.view === nombre;
        btn.classList.toggle("active", esActivo);
        btn.disabled = esActivo;
    });

    vistaHandlers[nombre]();
}

const vistaHandlers = {
    filtrar: () => {
        const api = initFilterView();
        filterLoadFromServer = api.loadFromServer;
    },
};

// ── Lista de archivos (barra lateral) ─────────────────────────────────────────

async function refrescarLista() {
    await renderFileList(
        listaArchivosEl,
        async (filename) => {
            if (vistaActual !== "filtrar") await cargarVista("filtrar");
            filterLoadFromServer?.(filename);
        },
    );
}

// ── Inicialización ─────────────────────────────────────────────────────────────

navBtns.forEach((btn) => {
    btn.addEventListener("click", () => cargarVista(btn.dataset.view));
});

const inicial = localStorage.getItem("vistaActual") || "filtrar";
cargarVista(inicial);
refrescarLista();
