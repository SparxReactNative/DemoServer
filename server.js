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
// app.get("/users", (req, res) => {
//   console.log("Received request:");
//   db.all("SELECT * FROM users", [], (err, rows) => {
//     if (err) {
//       res.status(500).json({ error: err.message });
//     } else {
//       res.json(rows);
//     }
//   });
// });

app.get("/users", (req, res) => {
  console.log("Received request:");

  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: err.message,
        data: [],
      });
    }

    res.status(200).json({
      status: "success",
      message: "Users fetched successfully",
      data: rows,
    });
  });
});

app.post("/users", (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({
      status: "error",
      message: "Name and phone number are required",
    });
  }

  // Check if the phone number already exists
  db.get("SELECT * FROM users WHERE phone = ?", [phone], (err, user) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: err.message,
      });
    }

    if (user) {
      // If user exists, return response
      return res.status(409).json({
        status: "error",
        message: `This phone number is already saved with the name: ${user.name}`,
      });
    }

    // If user does not exist, insert the new user
    db.run(
      "INSERT INTO users (name, phone) VALUES (?, ?)",
      [name, phone],
      function (err) {
        if (err) {
          return res.status(500).json({
            status: "error",
            message: err.message,
          });
        }

        res.status(201).json({
          status: "success",
          message: "User added successfully",
          data: {
            id: this.lastID,
            name,
            phone,
          },
        });
      }
    );
  });
});

app.post("/usersnew", (req, res) => {
  const { name, phone } = req.body;
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
