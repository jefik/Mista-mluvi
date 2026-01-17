import { Router } from "express";
import db from "./db.js";

const api = Router();

/* ---------------------------
   PINS ENDPOINTS
---------------------------- */

// GET /api/pins
api.get("/pins", (req, res) => {
  const pins = db.prepare("SELECT * FROM pins").all();
  res.json(pins);
});

// GET /api/pins/:id
api.get("/pins/:id", (req, res) => {
  const pin = db.prepare("SELECT * FROM pins WHERE id = ?").get(req.params.id);

  if (!pin) {
    return res.status(404).json({ error: "Pin not found" });
  }

  res.json(pin);
});

// POST /api/pins 
api.post("/pins", (req, res) => {
  const { latitude, longitude, message } = req.body;

  const insert = db.prepare(`
    INSERT INTO pins (latitude, longitude, message)
    VALUES (?, ?, ?)
  `);

  const result = insert.run(latitude, longitude, message);

  const pin = db.prepare("SELECT * FROM pins WHERE id = ?").get(result.lastInsertRowid);

  res.json(pin);
});


// DELETE /api/pins/:id 
api.delete("/pins/:id", (req, res) => {
  const stmt = db.prepare("DELETE FROM pins WHERE id = ?");
  const result = stmt.run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Pin not found" });
  }

  res.json({ deleted: true });
});


/* ---------------------------
   REPORTED PINS ENDPOINTS
---------------------------- */

// GET /api/reported-pins
api.get("/reported-pins", (req, res) => {
  const reports = db.prepare("SELECT * FROM reported_pins").all();
  res.json(reports);
});

// GET /api/reported-pins/:id 
api.get("/reported-pins/:id", (req, res) => {
  const report = db.prepare("SELECT * FROM reported_pins WHERE id = ?").get(req.params.id);

  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  res.json(report);
});

// POST /api/reported-pins
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
  res.json({ id: result.lastInsertRowid });
});


// DELETE /api/reported-pins/:id 
api.delete("/reported-pins/:id", (req, res) => {
  const stmt = db.prepare("DELETE FROM reported_pins WHERE id = ?");
  const result = stmt.run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Report not found" });
  }

  res.json({ deleted: true });
});

export default api;
