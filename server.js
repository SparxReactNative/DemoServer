const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = 8001;

// Middleware
// Allow all origins
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json()); // Ensure JSON request body is parsed
app.use(express.urlencoded({ extended: true })); // For form submissions

// Initialize SQLite Database
const db = new sqlite3.Database("./localdb.sqlite", (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database.");
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT
    )`);
  }
});
console.log("afasdf");
// Route to get all users
app.get("/users", (req, res) => {
  console.log("Received request:");
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Route to add a new user
app.post("/users", (req, res) => {
  console.log("Received request:", req.body); // Debugging log
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Missing name or phone" });
  }

  db.run(
    `INSERT INTO users (name, phone) VALUES (?, ?)`,
    [name, email],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, name, phone });
      }
    }
  );
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
