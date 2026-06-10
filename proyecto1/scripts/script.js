/* Controlador principal de la SPA — maneja la navegación y conecta los módulos */

import { renderFileList } from "/modules/fileList.js";
import { initCreateView } from "/modules/createView.js";
import { initModifyView } from "/modules/modifyView.js";

// ── Referencias ────────────────────────────────────────────────────────────────

const app             = document.getElementById("app");
const appLayout       = document.querySelector(".app-layout");
const navBtns         = document.querySelectorAll(".nav-btn");
const listaArchivosEl = document.getElementById("lista-archivos");

// Se asigna cuando se carga la vista modificar; null mientras no se haya cargado aún
let modifyLoadFromServer = null;
let vistaActual          = null; // rastrea la vista activa para evitar recargas innecesarias


//  CAMBIO DE TEMA ─────────────────────────────────────────────────────────────

// Lee la preferencia de color del sistema operativo al iniciar
const temaSistema = window.matchMedia("(prefers-color-scheme: dark)");

// Si el SO usa tema oscuro, aplica la clase dark automáticamente desde el inicio
if (temaSistema.matches) {
    document.body.classList.toggle('dark');
}

// El botón de tema alterna la clase "dark" en el body para cambiar entre claro y oscuro
const toggleTema = document.getElementById('toggle-tema');
toggleTema.addEventListener('click', () => {
    document.body.classList.toggle('dark');
});


// ── Carga de vistas ────────────────────────────────────────────────────────────

// Descarga el fragmento HTML de la vista, lo inyecta en #app y ejecuta su lógica
async function cargarVista(nombre) {
    // Persiste la vista activa en localStorage para restaurarla si el usuario recarga la página
    localStorage.setItem("vistaActual", nombre);
    vistaActual = nombre;

    // La vista "crear" usa un layout de dos columnas; las demás usan el layout por defecto
    appLayout.classList.toggle("layout-crear", nombre === "crear");

    // Obtiene el HTML de la vista desde la carpeta /views/ del servidor
    const res = await fetch(`/views/${nombre}.html`);
    app.innerHTML = await res.text(); // reemplaza el contenido actual con el nuevo fragmento

    // Actualiza los botones de navegación: el activo queda deshabilitado para evitar recargas
    navBtns.forEach((btn) => {
        const esActivo = btn.dataset.view === nombre;
        btn.classList.toggle("active", esActivo);
        btn.disabled = esActivo;
    });

    // Inicializa la lógica JS específica de la vista recién cargada
    vistaHandlers[nombre]();
}

// Mapa de vista → función de inicialización que se ejecuta después de inyectar el HTML
const vistaHandlers = {
    crear: () => {
        // Pasa refrescarLista como callback para que la vista actualice la barra lateral al guardar
        initCreateView(refrescarLista);
    },
    modificar: () => {
        const api = initModifyView(refrescarLista);
        // Guarda la referencia para poder abrir archivos desde la barra lateral
        modifyLoadFromServer = api.loadFromServer;
    },
};

// ── Lista de archivos (barra lateral) ─────────────────────────────────────────

// Vuelve a pedir la lista al servidor y la redibuja en el aside
async function refrescarLista() {
    await renderFileList(
        listaArchivosEl,
        async (filename) => {
            // Si el usuario hace click en "Modificar" desde la barra lateral y no está en esa vista,
            // la carga primero y luego abre el archivo; ?. evita el error si modifyLoadFromServer aún es null
            if (vistaActual !== "modificar") await cargarVista("modificar");
            modifyLoadFromServer?.(filename);
        },
        refrescarLista, // se pasa a sí misma para que fileList la llame al borrar un archivo
    );
}

// ── Inicialización ─────────────────────────────────────────────────────────────

// Conecta cada botón de navegación con la carga de su vista correspondiente
navBtns.forEach((btn) => {
    btn.addEventListener("click", () => cargarVista(btn.dataset.view));
});

// Arranca en la última vista visitada; si es la primera vez usa "crear" por defecto
const inicial = localStorage.getItem("vistaActual") || "crear";
cargarVista(inicial);
refrescarLista(); // carga la lista de archivos en paralelo con la vista inicial
