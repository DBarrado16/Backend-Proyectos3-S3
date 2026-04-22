const fs = require("fs/promises");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const CURRENT_FILE = path.join(DATA_DIR, "current.json");
const TOTAL_DAYS = 12;

function dayFilePath(day) {
  return path.join(DATA_DIR, `${day}.json`);
}

async function readCurrent() {
  const raw = await fs.readFile(CURRENT_FILE, "utf-8");
  return JSON.parse(raw);
}

async function writeCurrent(data) {
  await fs.writeFile(CURRENT_FILE, JSON.stringify(data, null, 2));
}

async function getCurrentStats() {
  const current = await readCurrent();
  const day = current.day;
  const raw = await fs.readFile(dayFilePath(day), "utf-8");
  const stats = JSON.parse(raw);
  return { day, ...stats };
}

async function setCurrentDay(day) {
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
    const err = new Error(`day debe ser un entero entre 1 y ${TOTAL_DAYS}`);
    err.code = "INVALID_DAY";
    throw err;
  }
  try {
    await fs.access(dayFilePath(day));
  } catch {
    const err = new Error(`No existe el archivo del día ${day}`);
    err.code = "DAY_NOT_FOUND";
    throw err;
  }
  await writeCurrent({ day });
  return { day };
}

async function listDays() {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);
}

module.exports = {
  getCurrentStats,
  setCurrentDay,
  listDays,
  TOTAL_DAYS,
};
