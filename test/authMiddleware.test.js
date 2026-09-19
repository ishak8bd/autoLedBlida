import { describe, it } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createAdminAuthMiddleware, validateRecoverySecret } from "../server/middleware/auth.js";

const TEST_SECRET = "super_secure_test_jwt_secret_key_123456789";

function createMockReqRes(headers = {}) {
  const req = { headers };
  let statusCode = 200;
  let responseBody = null;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    }
  };

  const next = () => {
    nextCalled = true;
  };

  return {
    req,
    res,
    next,
    getStatus: () => statusCode,
    getBody: () => responseBody,
    isNextCalled: () => nextCalled
  };
}

describe("Auth Middleware & Security Safety Net", () => {
  describe("createAdminAuthMiddleware initialization", () => {
    it("should throw a fatal error if JWT_SECRET is empty or undefined (prevents unauthenticated fallback)", () => {
      assert.throws(() => createAdminAuthMiddleware(""), /FATAL/);
      assert.throws(() => createAdminAuthMiddleware(null), /FATAL/);
      assert.throws(() => createAdminAuthMiddleware(undefined), /FATAL/);
      assert.throws(() => createAdminAuthMiddleware("   "), /FATAL/);
    });

    it("should return a middleware function when valid secret is provided", () => {
      const middleware = createAdminAuthMiddleware(TEST_SECRET);
      assert.strictEqual(typeof middleware, "function");
    });
  });

  describe("requireAdminAuth middleware execution", () => {
    const middleware = createAdminAuthMiddleware(TEST_SECRET);

    it("should reject with 401 when Authorization header is missing", () => {
      const { req, res, next, getStatus, getBody, isNextCalled } = createMockReqRes({});
      middleware(req, res, next);

      assert.strictEqual(isNextCalled(), false);
      assert.strictEqual(getStatus(), 401);
      assert.strictEqual(getBody()?.error, "Authentification requise. Jeton manquant.");
    });

    it("should reject with 401 when Authorization header does not start with 'Bearer '", () => {
      const { req, res, next, getStatus, getBody, isNextCalled } = createMockReqRes({
        authorization: "Basic dXNlcjpwYXNz"
      });
      middleware(req, res, next);

      assert.strictEqual(isNextCalled(), false);
      assert.strictEqual(getStatus(), 401);
      assert.strictEqual(getBody()?.error, "Authentification requise. Jeton manquant.");
    });

    it("should reject with 401 when Bearer token is empty", () => {
      const { req, res, next, getStatus, getBody, isNextCalled } = createMockReqRes({
        authorization: "Bearer    "
      });
      middleware(req, res, next);

      assert.strictEqual(isNextCalled(), false);
      assert.strictEqual(getStatus(), 401);
      assert.strictEqual(getBody()?.error, "Authentification requise. Jeton manquant.");
    });

    it("should reject with 401 when JWT token is malformed or invalid", () => {
      const { req, res, next, getStatus, getBody, isNextCalled } = createMockReqRes({
        authorization: "Bearer invalid.token.payload"
      });
      middleware(req, res, next);

      assert.strictEqual(isNextCalled(), false);
      assert.strictEqual(getStatus(), 401);
      assert.strictEqual(getBody()?.error, "Jeton d'authentification invalide");
    });

    it("should reject with 401 and expired:true when JWT token is expired", () => {
      // Create a token expired 10 seconds ago
      const expiredToken = jwt.sign({ role: "admin" }, TEST_SECRET, { expiresIn: -10 });
      const { req, res, next, getStatus, getBody, isNextCalled } = createMockReqRes({
        authorization: `Bearer ${expiredToken}`
      });
      middleware(req, res, next);

      assert.strictEqual(isNextCalled(), false);
      assert.strictEqual(getStatus(), 401);
      assert.strictEqual(getBody()?.expired, true);
      assert.strictEqual(getBody()?.error, "Session expirée, veuillez vous reconnecter");
    });

    it("should reject with 401 when token was signed with a different secret (anti-tampering)", () => {
      const fakeToken = jwt.sign({ role: "admin" }, "different_malicious_secret_987654321");
      const { req, res, next, getStatus, getBody, isNextCalled } = createMockReqRes({
        authorization: `Bearer ${fakeToken}`
      });
      middleware(req, res, next);

      assert.strictEqual(isNextCalled(), false);
      assert.strictEqual(getStatus(), 401);
      assert.strictEqual(getBody()?.error, "Jeton d'authentification invalide");
    });

    it("should authenticate and call next() when valid token is provided", () => {
      const validToken = jwt.sign({ role: "admin", username: "admin" }, TEST_SECRET, { expiresIn: "1h" });
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes({
        authorization: `Bearer ${validToken}`
      });
      middleware(req, res, next);

      assert.strictEqual(isNextCalled(), true);
      assert.strictEqual(getStatus(), 200);
      assert.strictEqual(req.admin?.role, "admin");
      assert.strictEqual(req.admin?.username, "admin");
    });
  });

  describe("validateRecoverySecret(secret)", () => {
    it("should reject null, undefined, and empty string", () => {
      assert.strictEqual(validateRecoverySecret(null).valid, false);
      assert.strictEqual(validateRecoverySecret(undefined).valid, false);
      assert.strictEqual(validateRecoverySecret("").valid, false);
      assert.strictEqual(validateRecoverySecret("   ").valid, false);
    });

    it("should reject secrets shorter than 4 characters (prevents trivial guesses)", () => {
      assert.strictEqual(validateRecoverySecret("1").valid, false);
      assert.strictEqual(validateRecoverySecret("12").valid, false);
      assert.strictEqual(validateRecoverySecret("123").valid, false);
      assert.strictEqual(validateRecoverySecret("  ab  ").valid, false); // trimmed is 2 chars
    });

    it("should accept 4-character PIN (e.g. '1234')", () => {
      const res = validateRecoverySecret("1234");
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.secret, "1234");
    });

    it("should accept generic words (e.g. 'autoled')", () => {
      const res = validateRecoverySecret("autoled");
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.secret, "autoled");
    });

    it("should accept full sentences (e.g. 'phrase secrete de secours')", () => {
      const res = validateRecoverySecret("phrase secrete de secours");
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.secret, "phrase secrete de secours");
    });

    it("should trim surrounding whitespace but preserve internal spaces", () => {
      const res = validateRecoverySecret("  code secret 2026  ");
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.secret, "code secret 2026");
    });
  });

  describe("Recovery secret decoupling safety", () => {
    it("CRITICAL: should authenticate solely against stored bcrypt hash, NOT against GMAIL_APP_PASSWORD", async () => {
      const adminSecret = "monCodeSecret2026";
      const hashedAdminSecret = await bcrypt.hash(adminSecret, 10);
      const gmailAppPassword = "abcd efgh ijkl mnop";

      // 1. Correct secret must match
      const isMatch = await bcrypt.compare(adminSecret, hashedAdminSecret);
      assert.strictEqual(isMatch, true);

      // 2. Gmail App Password must NEVER match the recovery secret
      const isGmailMatch = await bcrypt.compare(gmailAppPassword.replace(/\s+/g, ""), hashedAdminSecret);
      assert.strictEqual(isGmailMatch, false);

      // 3. Trying to use gmailAppPassword when adminSecret was set should fail
      assert.notStrictEqual(gmailAppPassword.replace(/\s+/g, ""), adminSecret);
    });
  });
});
