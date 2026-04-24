const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const FILE_PATH = path.join(DATA_DIR, "triggers.json");

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

async function writeAll(triggers) {
  await ensureFile();
  await fs.writeFile(FILE_PATH, JSON.stringify(triggers, null, 2));
}

async function listByEvent(eventID) {
  const all = await readAll();
  return all.filter((t) => String(t.eventID) === String(eventID));
}

async function getTriggerById(id) {
  const all = await readAll();
  return all.find((t) => t.id === id) || null;
}

async function createTrigger(data) {
  const all = await readAll();
  const now = new Date().toISOString();
  const trigger = {
    id: crypto.randomUUID(),
    eventID: data.eventID,
    triggerName: data.triggerName,
    conditionType: data.conditionType,
    conditionOperator: data.conditionOperator,
    conditionValue: data.conditionValue,
    message: data.message,
    channel: data.channel,
    audience: data.audience,
    active: data.active,
    createdAt: now,
    updatedAt: now,
  };
  all.push(trigger);
  await writeAll(all);
  return trigger;
}

async function updateTrigger(id, patch) {
  const all = await readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const mutable = [
    "triggerName",
    "conditionType",
    "conditionOperator",
    "conditionValue",
    "message",
    "channel",
    "audience",
    "active",
  ];
  for (const key of mutable) {
    if (patch[key] !== undefined) {
      all[idx][key] = patch[key];
    }
  }
  all[idx].updatedAt = new Date().toISOString();
  await writeAll(all);
  return all[idx];
}

async function deleteTrigger(id) {
  const all = await readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  all.splice(idx, 1);
  await writeAll(all);
  return true;
}

module.exports = {
  listByEvent,
  getTriggerById,
  createTrigger,
  updateTrigger,
  deleteTrigger,
};
