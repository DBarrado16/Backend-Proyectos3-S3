const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const { resolveMetric, evaluateCondition } = require("./metrics");
const { dispatch } = require("./dispatcher");

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
    units: data.units,
    warn: false, // gestionado solo por el servidor
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

  // warn NO está en la lista: nunca se permite que el usuario lo modifique.
  const mutable = [
    "triggerName",
    "conditionType",
    "conditionOperator",
    "conditionValue",
    "message",
    "channel",
    "audience",
    "active",
    "units",
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

/**
 * Construye un objeto recipient para el dispatcher a partir del campo
 * `audience` (string) y el canal del trigger.
 *   email     -> { email: audience }
 *   telegram  -> { telegramChatId: audience }
 *   push      -> { userId: audience }
 */
function buildRecipient(channel, audience) {
  switch (channel) {
    case "email":
      return { email: audience };
    case "telegram":
      return { telegramChatId: audience };
    case "push":
      return { userId: audience };
    default:
      return {};
  }
}

/**
 * Evalúa la condición de cada trigger contra el snapshot dado, actualiza el
 * campo `warn` en triggers.json en consecuencia y despacha el mensaje de los
 * triggers con `warn === true` por su canal y a su audiencia.
 *
 * Devuelve un resumen con cuántos triggers se evaluaron, cuántos quedaron en
 * estado warn y el detalle de cada despacho intentado.
 */
async function evaluateAndDispatchAll(snapshot) {
  const all = await readAll();
  const dispatches = [];
  let warnedCount = 0;

  for (const trigger of all) {
    const metric = resolveMetric(snapshot, trigger.conditionType, trigger.eventID);
    let warn = false;
    if (metric.ok) {
      warn = evaluateCondition(
        metric.value,
        trigger.conditionOperator,
        trigger.conditionValue
      );
    }
    trigger.warn = warn;
    trigger.updatedAt = new Date().toISOString();
    if (warn) warnedCount++;
  }

  await writeAll(all);

  for (const trigger of all) {
    if (!trigger.warn) continue;
    const recipient = buildRecipient(trigger.channel, trigger.audience);
    try {
      const results = await dispatch(trigger.message, [trigger.channel], recipient);
      dispatches.push({
        triggerId: trigger.id,
        triggerName: trigger.triggerName,
        channel: trigger.channel,
        results,
      });
    } catch (err) {
      dispatches.push({
        triggerId: trigger.id,
        triggerName: trigger.triggerName,
        channel: trigger.channel,
        error: err.message,
      });
    }
  }

  return {
    evaluated: all.length,
    warned: warnedCount,
    dispatches,
  };
}

module.exports = {
  listByEvent,
  getTriggerById,
  createTrigger,
  updateTrigger,
  deleteTrigger,
  evaluateAndDispatchAll,
};
