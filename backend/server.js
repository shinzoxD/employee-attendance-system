/**
 * server.js  – API + static server (+ DELETE route)
 */
const express  = require('express');
const cors     = require('cors');
const sqlite3  = require('sqlite3').verbose();
const path     = require('path');

const app  = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// serve static front-end assets
app.use(express.static(path.join(__dirname, '..')));

// ─── SQLite ──────────────────────────────────────────
const dbFile = path.join(__dirname, 'attendance.db');
const db     = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId  TEXT    NOT NULL,
      status      TEXT    NOT NULL,
      timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
});

// ─── API routes ──────────────────────────────────────

// POST /attendance
app.post('/attendance', (req, res) => {
  const { employeeId, status } = req.body || {};
  if (!employeeId || !status) {
    return res.status(400).json({ message: 'employeeId and status are required' });
  }
  db.run(
    `INSERT INTO attendance (employeeId, status) VALUES (?, ?)`,
    [employeeId.trim(), status.trim()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// GET /attendance
app.get('/attendance', (req, res) => {
  const { date } = req.query;
  let   sql      = 'SELECT * FROM attendance';
  const params   = [];
  if (date) {
    sql += ' WHERE date(timestamp)=date(?)';
    params.push(date);
  }
  sql += ' ORDER BY timestamp DESC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// NEW  – DELETE /attendance/:id
app.delete('/attendance/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM attendance WHERE id = ?`, [id], function (err) {
    if (err)   return res.status(500).json({ error: err.message });
    if (!this.changes) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true });
  });
});

app.listen(PORT, () =>
  console.log(`✅ API & static server running → http://127.0.0.1:${PORT}`)
);
