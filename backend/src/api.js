import { Router } from "express";
import db from "./db.js";
import rateLimit from "express-rate-limit";

const api = Router();

//Rate limiting - spam, dos attacks
// Limiter for messages
const apiLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 1, // max 1 request/min from same IP
  message: { error: "Další vzkaz můžete poslat až za 30 sekund." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for spamming likes
const likeShortLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 10,
  message: { error: "Další like můžete dát až za 30 sekund" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Daily limiter for spamming likes
const likeDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 100,
  message: { error: "Dosáhli jste denního limitu 100 lajků. Děkujeme za aktivitu!" },
  standardHeaders: true,
  legacyHeaders: false,
});

/* --------------------------------------------------------------------------------------------
   PINS ENDPOINTS
-----------------------------------------------------------------------------------------------*/

/**
 * @openapi
 * /api/pins:
 *   get:
 *     tags:
 *       - Pins
 *     summary: Get all pins
 *     responses:
 *       200:
 *         description: List of pins
 */
api.get("/pins", (req, res) => {
  const pins = db.prepare("SELECT * FROM pins").all();
  res.json(pins);
});

/**
 * @openapi
 * /api/pins/{id}:
 *   get:
 *     tags:
 *       - Pins
 *     summary: Get pin by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pin object
 *       404:
 *         description: Pin not found
 */
api.get("/pins/:id", (req, res) => {
  const pin = db.prepare("SELECT * FROM pins WHERE id = ?").get(req.params.id);

  if (!pin) {
    return res.status(404).json({ error: "Pin not found" });
  }

  res.json(pin);
});

/**
 * @openapi
 * /api/pins:
 *   post:
 *     tags:
 *       - Pins
 *     summary: Create a new pin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Created pin
 */
api.post("/pins", apiLimiter, (req, res) => {
  const { latitude, longitude, message, name } = req.body;
  // Validation
  const trimmedMessage = message?.trim() ?? "";
  const allowedChars = /^[a-zA-Z0-9á-žÁ-Ž\s@.!?,\-]+$/;
  // TODO: Block the ip of the bot
  // Validation against bots filling nonexistent input
  if (name) {
    console.warn("Triggered by bot!");
    return res.status(400).json({ error: "Request could not be processed" });
  }

  // Type validation of coordinates
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({ error: "Invalid coordinates" });
  }

  // Message text validation
  if (trimmedMessage.length === 0 || trimmedMessage.length > 1000) {
    return res.status(400).json({ error: "Message must be 1-1000 chars" });
  }

  // Validation for forbidden chars
  if (!allowedChars.test(trimmedMessage)) {
    return res.status(400).json({ error: "Forbidden characters in message" });
  }

  try {
    const insert = db.prepare(`
    INSERT INTO pins (latitude, longitude, message)
    VALUES (?, ?, ?)
  `);
    const result = insert.run(latitude, longitude, trimmedMessage);
    const pin = db.prepare("SELECT * FROM pins WHERE id = ?").get(result.lastInsertRowid);
    res.json(pin);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal database error" });
  }
});

/**
 * @openapi
 * /api/pins/{id}:
 *   delete:
 *     tags:
 *       - Pins
 *     summary: Delete pin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted
 */
api.delete("/pins/:id", (req, res) => {
  const stmt = db.prepare("DELETE FROM pins WHERE id = ?");
  const result = stmt.run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Pin not found" });
  }

  res.json({ deleted: true });
});

/**
 * @openapi
 * /api/pins/{id}/like:
 *   post:
 *     tags:
 *       - Pins
 *     summary: Update pin likes count
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               increment:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Like updated
 */
api.post(
  "/pins/:id/like",
  (req, res, next) => {
    const { increment } = req.body;
    // If user likes message, both limiters apply
    if (increment === true) {
      likeDailyLimiter(req, res, () => {
        likeShortLimiter(req, res, next);
      });
      // If user is removing like, limiters dont apply
    } else {
      next();
    }
  },
  (req, res) => {
    const { id } = req.params;
    const { increment } = req.body;

    try {
      const query = increment
        ? "UPDATE pins SET likes_count = likes_count + 1 WHERE id = ?"
        : "UPDATE pins SET likes_count = MAX(0, likes_count - 1) WHERE id = ?"; // Safe func against negative likes

      const stmt = db.prepare(query);
      const result = stmt.run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Pin not found" });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Internal database error" });
    }
  },
);
/* --------------------------------------------------------------------------------------------------
   REPORTED PINS ENDPOINTS
--------------------------------------------------------------------------------------------------- */

/**
 * @openapi
 * /api/reported-pins:
 *   get:
 *     tags:
 *       - Reported Pins
 *     summary: Get all reported pins
 *     responses:
 *       200:
 *         description: List of reported pins
 */
api.get("/reported-pins", (req, res) => {
  const reports = db.prepare("SELECT * FROM reported_pins").all();
  res.json(reports);
});

/**
 * @openapi
 * /api/reported-pins/{id}:
 *   get:
 *     tags:
 *       - Reported Pins
 *     summary: Get reported pin by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Report object
 *       404:
 *         description: Report not found
 */
api.get("/reported-pins/:id", (req, res) => {
  const report = db.prepare("SELECT * FROM reported_pins WHERE id = ?").get(req.params.id);

  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  res.json(report);
});

/**
 * @openapi
 * /api/reported-pins:
 *   post:
 *     tags:
 *       - Reported Pins
 *     summary: Create a new report
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pin_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Created report
 */
api.post("/reported-pins", (req, res) => {
  const { pin_id } = req.body;

  const pin = db.prepare("SELECT id FROM pins WHERE id = ?").get(pin_id);
  if (!pin) {
    return res.status(400).json({ error: "Pin not found" });
  }

  const stmt = db.prepare(`
    INSERT INTO reported_pins (pin_id)
    VALUES (?)
  `);

  const result = stmt.run(pin_id);
  const report = db.prepare("SELECT * FROM reported_pins WHERE id = ?").get(result.lastInsertRowid);

  res.json(report);
});

/**
 * @openapi
 * /api/reported-pins/{id}:
 *   delete:
 *     tags:
 *       - Reported Pins
 *     summary: Delete reported pin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted
 */
api.delete("/reported-pins/:id", (req, res) => {
  const stmt = db.prepare("DELETE FROM reported_pins WHERE id = ?");
  const result = stmt.run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Report not found" });
  }

  res.json({ deleted: true });
});

export default api;
