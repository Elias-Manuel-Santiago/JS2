import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

// __dirname no existe en ES modules; se reconstruye a partir de la URL del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3004;

// Carpeta donde se almacenan los archivos .txt de números
const FILES_DIR = path.join(__dirname, "files");

// Límites del formato de número (deben coincidir con los del cliente en validator.js)
const MIN_NUMBERS = 10;
const MAX_NUMBERS = 20;

// Parsea el body de las peticiones POST/PUT como JSON
app.use(express.json());

// Sirve los archivos estáticos de cada carpeta bajo su ruta correspondiente
app.use(express.static("pages"));        // index.html y otras páginas raíz
app.use("/scripts", express.static("scripts"));  // script.js principal
app.use("/styles", express.static("styles"));    // hojas de estilo CSS
app.use("/modules", express.static("modules"));  // módulos JS del cliente
app.use("/files", express.static("files"));      // archivos .txt descargables
app.use("/views", express.static("views"));      // fragmentos HTML de las vistas

// ── Páginas ────────────────────────────────────────────────────────────────────

// Ruta raíz: entrega la SPA; el resto de la navegación ocurre en el cliente
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/index.html"));
});

// ── API ────────────────────────────────────────────────────────────────────────

// Devuelve la lista de archivos .txt disponibles en el servidor
app.get("/api/files", (req, res) => {
  try {
    const files = fs.readdirSync(FILES_DIR).filter((f) => f.endsWith(".txt"));
    res.json(files);
  } catch {
    res.status(500).json({ error: "No se pudo leer el directorio de archivos" });
  }
});

// Devuelve el contenido de texto de un archivo (usado por la vista Modificar)
app.get("/api/files/:filename", (req, res) => {
  // path.basename elimina cualquier "../" del nombre para prevenir path traversal
  const safeName = path.basename(req.params.filename);
  const filePath = path.join(FILES_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Archivo no encontrado" });
  }
  const content = fs.readFileSync(filePath, "utf8");
  res.json({ content });
});

// Crea o sobreescribe un archivo con el array de números recibido como JSON
app.post("/api/files", (req, res) => {
  const { filename, numbers } = req.body;

  // Validación de estructura básica antes de tocar el disco
  if (!filename || !Array.isArray(numbers)) {
    return res.status(400).json({ error: "Nombre de archivo y numeros requeridos" });
  }

  // Validación de cantidad de números
  if (numbers.length < MIN_NUMBERS || numbers.length > MAX_NUMBERS) {
    return res.status(400).json({ error: `Debe tener entre ${MIN_NUMBERS}–${MAX_NUMBERS} numeros` });
  }

  // Rechaza NaN, Infinity y cualquier valor que no sea un número real
  if (!numbers.every((n) => typeof n === "number" && isFinite(n))) {
    return res.status(400).json({ error: "Todos los valores deben ser numeros finitos" });
  }

  // Prevención de path traversal: usar solo el nombre base del archivo
  const safeName = path.basename(filename);
  if (!safeName.endsWith(".txt")) {
    return res.status(400).json({ error: "El nombre del archivo debe terminar en .txt" });
  }

  // Escribe un número por línea, igual al formato que espera validateContent en el cliente
  fs.writeFileSync(path.join(FILES_DIR, safeName), numbers.join("\n"), "utf8");
  res.json({ filename: safeName });
});

// Elimina un archivo del servidor de forma permanente
app.delete("/api/files/:filename", (req, res) => {
  const safeName = path.basename(req.params.filename);
  const filePath = path.join(FILES_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Archivo no encontrado" });
  }
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

// ── Start ──────────────────────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`Server corriendo en http://localhost:${port}`);
});
