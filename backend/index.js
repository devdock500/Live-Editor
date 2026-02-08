import express from "express";
import http from "http";
import { Server } from "socket.io";
// import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import pool from "./db.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// --- Database Helper Functions ---

const ensureRoomExists = async (roomId) => {
  try {
    const [rows] = await pool.query("SELECT * FROM rooms WHERE room_id = ?", [roomId]);
    if (rows.length === 0) {
      await pool.query("INSERT INTO rooms (room_id) VALUES (?)", [roomId]);
      console.log(`Room ${roomId} created in DB.`);
    }
  } catch (err) {
    console.error("Error ensuring room exists:", err);
  }
};

// --- API Routes ---

// Get all files for a room
app.get("/api/files/:roomId", async (req, res) => {
  const { roomId } = req.params;
  try {
    await ensureRoomExists(roomId);
    const [files] = await pool.query("SELECT * FROM files WHERE room_id = ? ORDER BY created_at ASC", [roomId]);
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a new file
app.post("/api/files", async (req, res) => {
  const { roomId, filename, content } = req.body;
  if (!roomId || !filename) {
    return res.status(400).json({ error: "Missing roomId or filename" });
  }
  try {
    await ensureRoomExists(roomId);
    const [result] = await pool.query(
      "INSERT INTO files (room_id, filename, content) VALUES (?, ?, ?)",
      [roomId, filename, content || ""]
    );
    const newFile = {
      file_id: result.insertId,
      room_id: roomId,
      filename,
      content: content || "",
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Notify room about new file
    io.to(roomId).emit("fileCreated", newFile);
    
    res.status(201).json(newFile);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: "File already exists in this room" });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
});

// Update file content (Can be used for manual save, though sockets handle real-time)
app.put("/api/files/:fileId", async (req, res) => {
  const { fileId } = req.params;
  const { content } = req.body;
  try {
    await pool.query("UPDATE files SET content = ? WHERE file_id = ?", [content, fileId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Rename file
app.put("/api/files/:fileId/rename", async (req, res) => {
  const { fileId } = req.params;
  const { newFilename } = req.body;
  try {
    const [rows] = await pool.query("SELECT room_id FROM files WHERE file_id = ?", [fileId]);
    if (rows.length > 0) {
      const { room_id } = rows[0];
      await pool.query("UPDATE files SET filename = ? WHERE file_id = ?", [newFilename, fileId]);
      
      io.to(room_id).emit("fileRenamed", { fileId: parseInt(fileId), newFilename });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "File not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a file
app.delete("/api/files/:fileId", async (req, res) => {
  const { fileId } = req.params;
  try {
    // Get room_id before deleting to notify room
    const [rows] = await pool.query("SELECT room_id FROM files WHERE file_id = ?", [fileId]);
    if (rows.length > 0) {
      const { room_id } = rows[0];

      // Check if it's the last file in the room
      const [countResult] = await pool.query("SELECT COUNT(*) as count FROM files WHERE room_id = ?", [room_id]);
      if (countResult[0].count <= 1) {
        return res.status(400).json({ error: "Cannot delete the last file in the room" });
      }

      await pool.query("DELETE FROM files WHERE file_id = ?", [fileId]);
      
      // Notify room
      io.to(room_id).emit("fileDeleted", fileId);
      
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "File not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Socket Logic ---

// Map<roomId, Map<socketId, userName>>
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  let currentRoom = null;

  // User joins a room
  socket.on("join", async ({ roomId, userName }) => {
    currentRoom = roomId;
    
    // Ensure room exists in DB
    await ensureRoomExists(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    rooms.get(roomId).set(socket.id, userName);

    // Emit updated users list
    io.to(roomId).emit(
      "userJoined",
      Array.from(rooms.get(roomId).values())
    );

    socket.join(roomId);
  });

  // Code changes - Sync and Persist
  // Use a simple in-memory debounce map to avoid hammering the DB
  const dbUpdateTimeouts = new Map();

  socket.on("codeChange", async ({ roomId, fileId, code }) => {
    // Broadcast to others in the room immediately for real-time feel
    socket.to(roomId).emit("codeUpdate", { fileId, code });
    
    // Persist to DB (Debounced)
    if (fileId) {
        // Clear existing timeout for this file
        if (dbUpdateTimeouts.has(fileId)) {
            clearTimeout(dbUpdateTimeouts.get(fileId));
        }

        // Set new timeout (e.g., 2 seconds)
        const timeout = setTimeout(async () => {
            try {
                await pool.query("UPDATE files SET content = ? WHERE file_id = ?", [code, fileId]);
                // console.log(`File ${fileId} saved to DB.`);
                dbUpdateTimeouts.delete(fileId);
            } catch (err) {
                console.error("Error saving code to DB:", err);
            }
        }, 2000);

        dbUpdateTimeouts.set(fileId, timeout);
    }
  });

  // Typing indicator
  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });

  // Language change - now per file, but for simplicity we can keep it global or just ignore
  // Ideally language is derived from filename extension
  socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language);
  });

  // User leaves room
  socket.on("leaveRoom", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(socket.id);

      // Emit updated users list
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom).values())
      );

      socket.leave(currentRoom);

      // Delete room from memory if empty (DB persists it)
      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
      }

      currentRoom = null;
    }
  });

  // On disconnect
  socket.on("disconnect", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(socket.id);

      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom).values())
      );

      // Delete room from memory if empty
      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
      }
    }

    console.log("User Disconnected:", socket.id);
  });
});

// // Serve frontend
// app.use(express.static(path.join(__dirname, "../frontend/real-time-editor/dist")));
// app.get("/*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/real-time-editor/dist", "index.html"));
// });

const port = process.env.PORT || 5003;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
