const { z } = require("zod");

const plantillaCreateSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100, "El nombre no puede superar los 100 caracteres"),
  text: z.string().min(1, "El texto es obligatorio").max(2250, "El texto no puede superar los 2250 caracteres"),
});

const plantillaUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  text: z.string().min(1).max(2250).optional(),
}).refine((data) => data.name !== undefined || data.text !== undefined, {
  message: "Debes enviar al menos name o text para actualizar",
});

const idParamSchema = z.object({
  id: z.string().uuid("El id debe ser un UUID válido"),
});

module.exports = {
  plantillaCreateSchema,
  plantillaUpdateSchema,
  idParamSchema,
};
