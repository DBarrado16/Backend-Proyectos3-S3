const { Router } = require("express");
const jwt = require("jsonwebtoken");

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES_IN = "8h";

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Obtiene un token JWT para acceder a la API
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Token JWT generado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciales incorrectas
 */
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  const validUser = process.env.ADMIN_USERNAME || "admin";
  const validPass = process.env.ADMIN_PASSWORD || "admin";

  if (!username || !password || username !== validUser || password !== validPass) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Usuario o contraseña incorrectos." });
  }

  const token = jwt.sign({ sub: username, role: "admin" }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({ token, expiresIn: JWT_EXPIRES_IN });
});

module.exports = router;
