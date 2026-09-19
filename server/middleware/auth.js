import jwt from "jsonwebtoken";

/**
 * Creates the admin authentication middleware with strict JWT validation.
 * @param {string} jwtSecret - The secret used to verify JWT tokens
 * @returns {Function} Express middleware (req, res, next)
 */
export function createAdminAuthMiddleware(jwtSecret) {
  if (!jwtSecret || typeof jwtSecret !== "string" || !jwtSecret.trim()) {
    throw new Error("FATAL: A non-empty JWT_SECRET must be provided to createAdminAuthMiddleware");
  }

  return function requireAdminAuth(req, res, next) {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentification requise. Jeton manquant." });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ error: "Authentification requise. Jeton manquant." });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.admin = decoded;
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Session expirée, veuillez vous reconnecter",
          expired: true
        });
      }
      return res.status(401).json({ error: "Jeton d'authentification invalide" });
    }
  };
}

/**
 * Validates a recovery secret according to the generic secret rule:
 * - Must be at least 4 characters long
 * - No arbitrary formatting constraints (accepts PINs, words, phrases)
 * @param {string} secret
 * @returns {{ valid: boolean, error?: string, secret?: string }}
 */
export function validateRecoverySecret(secret) {
  if (secret === undefined || secret === null) {
    return {
      valid: false,
      error: "Le code de récupération doit comporter au moins 4 caractères (PIN, mot ou phrase)."
    };
  }
  const clean = String(secret).trim();
  if (clean.length < 4) {
    return {
      valid: false,
      error: "Le code de récupération doit comporter au moins 4 caractères (PIN, mot ou phrase)."
    };
  }
  return { valid: true, secret: clean };
}
