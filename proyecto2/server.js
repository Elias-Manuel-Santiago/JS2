import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3005;

// Carpeta compartida con proyecto1
const FILES_DIR = path.join(__dirname, "../proyecto1/files");

app.use(express.json());
app.use(express.static("pages"));
app.use("/scripts", express.static("scripts"));
app.use("/styles", express.static("styles"));
app.use("/modules", express.static("modules"));
app.use("/views", express.static("views"));

// ── Páginas ────────────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/index.html"));
});

// ── API ────────────────────────────────────────────────────────────────────────

// Lista todos los .txt del directorio compartido con proyecto1
app.get("/api/files", (req, res) => {
  try {
    const files = fs.readdirSync(FILES_DIR).filter((f) => f.endsWith(".txt"));
    res.json(files);
  } catch {
    res.status(500).json({ error: "No se pudo leer el directorio de archivos" });
  }
});

// Devuelve el contenido de texto de un archivo
app.get("/api/files/:filename", (req, res) => {
  const safeName = path.basename(req.params.filename);
  const filePath = path.join(FILES_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Archivo no encontrado" });
  }
  const content = fs.readFileSync(filePath, "utf8");
  res.json({ content });
});

// ── Start ──────────────────────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`Server corriendo en http://localhost:${port}`);
});
