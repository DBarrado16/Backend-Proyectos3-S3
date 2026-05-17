const fs = require("fs/promises");
const path = require("path");

class StatsService {
  static TOTAL_DAYS = 12;

  constructor() {
    this.dataDir = path.join(__dirname, "..", "..", "data");
    this.currentFile = path.join(this.dataDir, "current.json");
  }

  #dayFilePath(day) {
    return path.join(this.dataDir, `${day}.json`);
  }

  async #readCurrent() {
    const raw = await fs.readFile(this.currentFile, "utf-8");
    return JSON.parse(raw);
  }

  async #writeCurrent(data) {
    await fs.writeFile(this.currentFile, JSON.stringify(data, null, 2));
  }

  async getCurrentStats() {
    const current = await this.#readCurrent();
    const day = current.day;
    const raw = await fs.readFile(this.#dayFilePath(day), "utf-8");
    const stats = JSON.parse(raw);
    return { day, ...stats };
  }

  async setCurrentDay(day) {
    if (!Number.isInteger(day) || day < 1 || day > StatsService.TOTAL_DAYS) {
      const err = new Error(`day debe ser un entero entre 1 y ${StatsService.TOTAL_DAYS}`);
      err.code = "INVALID_DAY";
      throw err;
    }
    try {
      await fs.access(this.#dayFilePath(day));
    } catch {
      const err = new Error(`No existe el archivo del día ${day}`);
      err.code = "DAY_NOT_FOUND";
      throw err;
    }
    await this.#writeCurrent({ day });
    return { day };
  }

  async listDays() {
    return Array.from({ length: StatsService.TOTAL_DAYS }, (_, i) => i + 1);
  }
}

const statsService = new StatsService();
module.exports = statsService;
module.exports.TOTAL_DAYS = StatsService.TOTAL_DAYS;
