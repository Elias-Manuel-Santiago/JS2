/* Controlador principal de la SPA — maneja la navegación y conecta los módulos */

import { renderFileList } from "/modules/fileList.js";
import { initCreateView } from "/modules/createView.js";
import { initModifyView } from "/modules/modifyView.js";

// ── Referencias ────────────────────────────────────────────────────────────────

const app             = document.getElementById("app");
const appLayout       = document.querySelector(".app-layout");
const navBtns         = document.querySelectorAll(".nav-btn");
const listaArchivosEl = document.getElementById("lista-archivos");

// Se asigna después de cargar la vista modificar
let modifyLoadFromServer = null;
let vistaActual          = null;


//  CAMBIO DE TEMA ------------------------------------------------
// Almacena el tema del sistema
const temaSistema = window.matchMedia("(prefers-color-scheme: dark)");

// Si el tema del sistema es oscuro, cambia el tema del sitio a oscuro
if (temaSistema.matches) {
    document.body.classList.toggle('dark');
}

// Alterna la clase "dark" en el body para cambiar el tema visual
const toggleTema = document.getElementById('toggle-tema');
toggleTema.addEventListener('click', () => {
    document.body.classList.toggle('dark');
});



// ── Carga de vistas ────────────────────────────────────────────────────────────

// Obtiene el fragmento HTML, lo inyecta en #app y activa la lógica de esa vista
async function cargarVista(nombre) {
    localStorage.setItem("vistaActual", nombre);
    vistaActual = nombre;

    appLayout.classList.toggle("layout-crear", nombre === "crear");

    const res = await fetch(`/views/${nombre}.html`);
    app.innerHTML = await res.text();

    // Marca el botón activo y deshabilita solo ese (igual que projecto1)
    navBtns.forEach((btn) => {
        const esActivo = btn.dataset.view === nombre;
        btn.classList.toggle("active", esActivo);
        btn.disabled = esActivo;
    });

    vistaHandlers[nombre]();
}

// Lógica a ejecutar después de inyectar el HTML de cada vista
const vistaHandlers = {
    crear: () => {
        initCreateView(refrescarLista);
    },
    modificar: () => {
        const api = initModifyView(refrescarLista);
        modifyLoadFromServer = api.loadFromServer;
    },
};

// ── Lista de archivos (barra lateral) ─────────────────────────────────────────

async function refrescarLista() {
    await renderFileList(
        listaArchivosEl,
        async (filename) => {
            // Si no estamos en la vista modificar, la cargamos primero
            if (vistaActual !== "modificar") await cargarVista("modificar");
            modifyLoadFromServer?.(filename);
        },
        refrescarLista,
    );
}

// ── Inicialización ─────────────────────────────────────────────────────────────

navBtns.forEach((btn) => {
    btn.addEventListener("click", () => cargarVista(btn.dataset.view));
});

// Arranca en la última vista visitada, o en "crear" si es la primera vez
const inicial = localStorage.getItem("vistaActual") || "crear";
cargarVista(inicial);
refrescarLista();
