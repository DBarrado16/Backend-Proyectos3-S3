const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const FILE_PATH = path.join(DATA_DIR, "plantillas.json");

async function ensureFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(FILE_PATH);
  } catch {
    await fs.writeFile(FILE_PATH, JSON.stringify([], null, 2));
  }
}

async function readAll() {
  await ensureFile();
  const raw = await fs.readFile(FILE_PATH, "utf-8");
  return JSON.parse(raw);
}

async function writeAll(plantillas) {
  await ensureFile();
  await fs.writeFile(FILE_PATH, JSON.stringify(plantillas, null, 2));
}

async function listPlantillas() {
  return await readAll();
}

async function getPlantillaById(id) {
  const all = await readAll();
  return all.find((p) => p.id === id) || null;
}

async function createPlantilla({ name, text }) {
  const all = await readAll();
  const now = new Date().toISOString();
  const plantilla = {
    id: crypto.randomUUID(),
    name,
    text,
    createdAt: now,
    updatedAt: now,
  };
  all.push(plantilla);
  await writeAll(all);
  return plantilla;
}

async function updatePlantilla(id, { name, text }) {
  const all = await readAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  if (name !== undefined) all[idx].name = name;
  if (text !== undefined) all[idx].text = text;
  all[idx].updatedAt = new Date().toISOString();

  await writeAll(all);
  return all[idx];
}

async function deletePlantilla(id) {
  const all = await readAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  all.splice(idx, 1);
  await writeAll(all);
  return true;
}

module.exports = {
  listPlantillas,
  getPlantillaById,
  createPlantilla,
  updatePlantilla,
  deletePlantilla,
};
