const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const { resolveMetric, evaluateCondition } = require("./metrics");
const { dispatch } = require("./dispatcher");

class TriggersService {
  constructor() {
    this.dataDir = path.join(__dirname, "..", "..", "data");
    this.filePath = path.join(this.dataDir, "triggers.json");
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

  async #writeAll(triggers) {
    await this.#ensureFile();
    await fs.writeFile(this.filePath, JSON.stringify(triggers, null, 2));
  }

  #buildRecipient(channel, audience) {
    switch (channel) {
      case "email":     return { email: audience };
      case "telegram":  return { telegramChatId: audience };
      case "push":      return { userId: audience };
      default:          return {};
    }
  }

  async listByEvent(eventID) {
    const all = await this.#readAll();
    return all.filter((t) => String(t.eventID) === String(eventID));
  }

  async getTriggerById(id) {
    const all = await this.#readAll();
    return all.find((t) => t.id === id) || null;
  }

  async createTrigger(data) {
    const all = await this.#readAll();
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
      warn: false,
      createdAt: now,
      updatedAt: now,
    };
    all.push(trigger);
    await this.#writeAll(all);
    return trigger;
  }

  async updateTrigger(id, patch) {
    const all = await this.#readAll();
    const idx = all.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const mutable = [
      "triggerName", "conditionType", "conditionOperator", "conditionValue",
      "message", "channel", "audience", "active", "units",
    ];
    for (const key of mutable) {
      if (patch[key] !== undefined) all[idx][key] = patch[key];
    }
    all[idx].updatedAt = new Date().toISOString();
    await this.#writeAll(all);
    return all[idx];
  }

  async deleteTrigger(id) {
    const all = await this.#readAll();
    const idx = all.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    all.splice(idx, 1);
    await this.#writeAll(all);
    return true;
  }

  async evaluateAndDispatchAll(snapshot) {
    const all = await this.#readAll();
    const dispatches = [];
    let warnedCount = 0;

    for (const trigger of all) {
      const metric = resolveMetric(snapshot, trigger.conditionType, trigger.eventID);
      let warn = false;
      if (metric.ok) {
        warn = evaluateCondition(metric.value, trigger.conditionOperator, trigger.conditionValue);
      }
      trigger.warn = warn;
      trigger.updatedAt = new Date().toISOString();
      if (warn) warnedCount++;
    }

    await this.#writeAll(all);

    for (const trigger of all) {
      if (!trigger.warn) continue;
      const recipient = this.#buildRecipient(trigger.channel, trigger.audience);
      try {
        const results = await dispatch(trigger.message, [trigger.channel], recipient);
        dispatches.push({ triggerId: trigger.id, triggerName: trigger.triggerName, channel: trigger.channel, results });
      } catch (err) {
        dispatches.push({ triggerId: trigger.id, triggerName: trigger.triggerName, channel: trigger.channel, error: err.message });
      }
    }

    return { evaluated: all.length, warned: warnedCount, dispatches };
  }
}

module.exports = new TriggersService();
