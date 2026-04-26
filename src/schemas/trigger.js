const { z } = require("zod");

const triggerBaseFields = {
  triggerName: z
    .string()
    .min(1, "triggerName es obligatorio")
    .max(50, "triggerName no puede superar los 50 caracteres"),
  conditionType: z.string().min(1, "conditionType es obligatorio"),
  conditionOperator: z.enum(["<", ">"], {
    errorMap: () => ({ message: "conditionOperator debe ser '<' o '>'" }),
  }),
  conditionValue: z.number({
    invalid_type_error: "conditionValue debe ser numérico",
  }),
  message: z
    .string()
    .min(1, "message es obligatorio")
    .max(2250, "message no puede superar los 2250 caracteres"),
  channel: z.enum(["email", "telegram", "push"], {
    errorMap: () => ({ message: "channel debe ser 'email', 'telegram' o 'push'" }),
  }),
  audience: z.string().min(1, "audience es obligatoria"),
  active: z.boolean({
    invalid_type_error: "active debe ser booleano",
  }),
  units: z.enum(["%", "t", "d", "$"], {
    errorMap: () => ({
      message: "units debe ser '%' (porcentaje), 't' (tickets), 'd' (días) o '$' (dólares)",
    }),
  }),
};

const triggerCreateSchema = z.object({
  eventID: z.string().min(1, "eventID es obligatorio"),
  ...triggerBaseFields,
});

// Update: todos los campos opcionales, NO se permite eventID ni warn (warn es
// gestionado únicamente por el servidor), y el body no puede estar vacío.
const triggerUpdateSchema = z
  .object({
    triggerName: triggerBaseFields.triggerName.optional(),
    conditionType: triggerBaseFields.conditionType.optional(),
    conditionOperator: triggerBaseFields.conditionOperator.optional(),
    conditionValue: triggerBaseFields.conditionValue.optional(),
    message: triggerBaseFields.message.optional(),
    channel: triggerBaseFields.channel.optional(),
    audience: triggerBaseFields.audience.optional(),
    active: triggerBaseFields.active.optional(),
    units: triggerBaseFields.units.optional(),
  })
  .strict() // rechaza eventID, warn u otros campos no esperados
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

const idParamSchema = z.object({
  id: z.string().uuid("El id debe ser un UUID válido"),
});

const listQuerySchema = z.object({
  eventID: z.string().min(1, "eventID es obligatorio como query param"),
});

module.exports = {
  triggerCreateSchema,
  triggerUpdateSchema,
  idParamSchema,
  listQuerySchema,
};
