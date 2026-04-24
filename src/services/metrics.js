/**
 * Resuelve el valor numérico de una métrica dentro del snapshot actual de stats.
 *
 * Métricas globales (no requieren eventID, se leen de snapshot.global_stats):
 *   - total_events
 *   - attendee_count
 *   - gross_value        -> gross.value (céntimos)
 *   - gross              -> gross.major_value (euros como número)
 *
 * Métricas por evento (requieren eventID, se leen de events[i] y su ticket_classes[0]):
 *   - capacity
 *   - quantity_sold
 *   - quantity_total
 *   - quantity_remaining  -> capacity - quantity_sold
 *   - percent_sold        -> (quantity_sold / capacity) * 100
 *   - percent_remaining   -> 100 - percent_sold
 *   - gross_value         -> quantity_sold * cost.value (céntimos)
 *   - price               -> cost.value / 100 (euros)
 */

const GLOBAL_METRICS = new Set([
  "total_events",
  "attendee_count",
  "gross_value",
  "gross",
]);

const EVENT_METRICS = new Set([
  "capacity",
  "quantity_sold",
  "quantity_total",
  "quantity_remaining",
  "percent_sold",
  "percent_remaining",
  "gross_value",
  "price",
]);

function listSupportedMetrics() {
  return {
    global: [...GLOBAL_METRICS],
    event: [...EVENT_METRICS],
  };
}

function isGlobalMetric(type) {
  return GLOBAL_METRICS.has(type);
}

function isEventMetric(type) {
  return EVENT_METRICS.has(type);
}

function resolveGlobalMetric(snapshot, type) {
  const gs = snapshot?.global_stats;
  if (!gs) return null;
  switch (type) {
    case "total_events":
      return Number(gs.total_events);
    case "attendee_count":
      return Number(gs.attendee_count);
    case "gross_value":
      return Number(gs.gross?.value);
    case "gross":
      return Number(gs.gross?.major_value);
    default:
      return null;
  }
}

function resolveEventMetric(event, type) {
  if (!event) return null;
  const tc = event.ticket_classes?.[0];
  if (!tc) return null;

  const capacity = Number(event.capacity ?? tc.quantity_total);
  const quantitySold = Number(tc.quantity_sold);
  const quantityTotal = Number(tc.quantity_total);
  const costValue = Number(tc.cost?.value);

  switch (type) {
    case "capacity":
      return capacity;
    case "quantity_sold":
      return quantitySold;
    case "quantity_total":
      return quantityTotal;
    case "quantity_remaining":
      return capacity - quantitySold;
    case "percent_sold":
      return capacity > 0 ? (quantitySold / capacity) * 100 : 0;
    case "percent_remaining":
      return capacity > 0 ? 100 - (quantitySold / capacity) * 100 : 0;
    case "gross_value":
      return quantitySold * costValue;
    case "price":
      return costValue / 100;
    default:
      return null;
  }
}

/**
 * Resuelve la métrica en el snapshot.
 * Si se proporciona eventID, se busca el evento por id y se intenta como métrica
 * de evento; si conditionType es global y no encontramos evento, se cae a global.
 * Si no se proporciona eventID, se exige métrica global.
 *
 * Devuelve { ok, value, scope, error } — si ok=false, error explica el problema.
 */
function resolveMetric(snapshot, conditionType, eventID) {
  if (!snapshot) {
    return { ok: false, error: "Snapshot de stats no disponible" };
  }

  if (eventID) {
    const event = (snapshot.events || []).find((e) => String(e.id) === String(eventID));
    if (!event) {
      return {
        ok: false,
        error: `No existe un evento con id "${eventID}" en el snapshot actual`,
      };
    }
    if (isEventMetric(conditionType)) {
      const value = resolveEventMetric(event, conditionType);
      if (value === null || Number.isNaN(value)) {
        return { ok: false, error: `No se pudo resolver la métrica "${conditionType}" para el evento ${eventID}` };
      }
      return { ok: true, value, scope: "event", eventID };
    }
    if (isGlobalMetric(conditionType)) {
      const value = resolveGlobalMetric(snapshot, conditionType);
      if (value === null || Number.isNaN(value)) {
        return { ok: false, error: `No se pudo resolver la métrica global "${conditionType}"` };
      }
      return { ok: true, value, scope: "global" };
    }
    return {
      ok: false,
      error: `conditionType "${conditionType}" no está soportado. Ver /notifications/metrics`,
    };
  }

  // Sin eventID -> métrica global obligatoria
  if (isGlobalMetric(conditionType)) {
    const value = resolveGlobalMetric(snapshot, conditionType);
    if (value === null || Number.isNaN(value)) {
      return { ok: false, error: `No se pudo resolver la métrica global "${conditionType}"` };
    }
    return { ok: true, value, scope: "global" };
  }
  if (isEventMetric(conditionType)) {
    return {
      ok: false,
      error: `La métrica "${conditionType}" es de evento y requiere un eventID en el body`,
    };
  }
  return {
    ok: false,
    error: `conditionType "${conditionType}" no está soportado. Ver /notifications/metrics`,
  };
}

function evaluateCondition(actualValue, operator, conditionValue) {
  if (actualValue === null || actualValue === undefined || Number.isNaN(actualValue)) {
    return false;
  }
  const a = Number(actualValue);
  const b = Number(conditionValue);
  if (operator === ">") return a > b;
  if (operator === "<") return a < b;
  return false;
}

module.exports = {
  resolveMetric,
  evaluateCondition,
  listSupportedMetrics,
  isGlobalMetric,
  isEventMetric,
  GLOBAL_METRICS,
  EVENT_METRICS,
};
