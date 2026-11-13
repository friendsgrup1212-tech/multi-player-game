
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

function makeRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.get("/", (req, res) => {
  res.send("SP BHAI Gaming Server is Running!");
});

io.on("connection", socket => {
  console.log("Player connected:", socket.id);

  socket.on("create-room", ({ name, count }) => {
    const maxPlayers = Number(count);

    if (!name || ![2, 4].includes(maxPlayers)) {
      return socket.emit("error-message", "Invalid player details");
    }

    let roomId = makeRoomId();

    while (rooms.has(roomId)) {
      roomId = makeRoomId();
    }

    rooms.set(roomId, {
      maxPlayers,
      players: [{
        id: socket.id,
        name: name.trim()
      }],
      gameStarted: false
    });

    socket.join(roomId);
    socket.data.roomId = roomId;

    socket.emit("room-created", { roomId });
    console.log("Room created:", roomId);
  });

  socket.on("join-room", ({ name, roomId }) => {
    const id = String(roomId || "").trim().toUpperCase();
    const room = rooms.get(id);

    if (!room) {
      return socket.emit("error-message", "Room not found!");
    }

    if (room.players.length >= room.maxPlayers) {
      return socket.emit("error-message", "Room is full!");
    }

    if (room.gameStarted) {
      return socket.emit("error-message", "Game already started!");
    }

    if (!name || !name.trim()) {
      return socket.emit("error-message", "Enter your name!");
    }

    room.players.push({
      id: socket.id,
      name: name.trim()
    });

    socket.join(id);
    socket.data.roomId = id;

    socket.emit("room-joined", { roomId: id });

    io.to(id).emit("player-joined", {
      players: room.players.length,
      maxPlayers: room.maxPlayers,
      playerList: room.players.map(p => p.name)
    });

    if (room.players.length === room.maxPlayers) {
      room.gameStarted = true;
      io.to(id).emit("game-ready", {
        players: room.players.map(p => p.name)
      });
    }
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.players = room.players.filter(
      player => player.id !== socket.id
    );

    io.to(roomId).emit("player-left", {
      players: room.players.length
    });

    if (room.players.length === 0) {
      rooms.delete(roomId);
    } else {
      room.gameStarted = false;
    }

    console.log("Player disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Gaming server running on port ${PORT}`);
});
