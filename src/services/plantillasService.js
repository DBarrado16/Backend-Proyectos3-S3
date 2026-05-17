const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

class PlantillasService {
  constructor() {
    this.dataDir = path.join(__dirname, "..", "..", "data");
    this.filePath = path.join(this.dataDir, "plantillas.json");
  }

  async #ensureFile() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
    }
  }

  async #readAll() {
    await this.#ensureFile();
    const raw = await fs.readFile(this.filePath, "utf-8");
    return JSON.parse(raw);
  }

  async #writeAll(plantillas) {
    await this.#ensureFile();
    await fs.writeFile(this.filePath, JSON.stringify(plantillas, null, 2));
  }

  async listPlantillas() {
    return this.#readAll();
  }

  async getPlantillaById(id) {
    const all = await this.#readAll();
    return all.find((p) => p.id === id) || null;
  }

  async createPlantilla({ name, text }) {
    const all = await this.#readAll();
    const now = new Date().toISOString();
    const plantilla = {
      id: crypto.randomUUID(),
      name,
      text,
      createdAt: now,
      updatedAt: now,
    };
    all.push(plantilla);
    await this.#writeAll(all);
    return plantilla;
  }

  async updatePlantilla(id, { name, text }) {
    const all = await this.#readAll();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    if (name !== undefined) all[idx].name = name;
    if (text !== undefined) all[idx].text = text;
    all[idx].updatedAt = new Date().toISOString();

    await this.#writeAll(all);
    return all[idx];
  }

  async deletePlantilla(id) {
    const all = await this.#readAll();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    all.splice(idx, 1);
    await this.#writeAll(all);
    return true;
  }
}

module.exports = new PlantillasService();
