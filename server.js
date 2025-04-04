const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = 8001;

// Middleware
// Allow all origin
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

app.post("/users/bulk-lookup", (req, res) => {
  const { phones } = req.body; // Expecting an array of phone numbers

  if (!Array.isArray(phones) || phones.length === 0) {
    return res.status(400).json({
      status: "error",
      message: "Phones must be a non-empty array",
    });
  }

  // Normalize all phone numbers to last 10 digits for lookup
  const normalizedPhones = phones.map((phone) => ({
    original: phone, // Keep original format
    normalized: phone.slice(-10), // Extract last 10 digits
  }));

  // SQL query to fetch all users from the database
  const sql = `SELECT phone, name FROM users`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: err.message,
      });
    }

    // Normalize DB phone numbers for comparison
    const normalizedUsers = rows.map((user) => ({
      phone: user.phone.slice(-10), // Last 10 digits
      name: user.name,
    }));

    // Map input phones to database results
    const mappedResults = normalizedPhones.map(({ original, normalized }) => {
      const user = normalizedUsers.find((user) => user.phone === normalized);
      return {
        phone: original, // Preserve original input format
        name: user ? user.name : null,
      };
    });

    res.status(200).json({
      status: "success",
      message: "Phone number lookup completed",
      data: mappedResults,
    });
  });
});

// Start Server ok
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
