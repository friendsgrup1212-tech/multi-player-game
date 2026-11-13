
const BACKEND_URL = "https://YOUR-BACKEND-URL";

let socket;
let currentRoom = "";
let localPlayers = 2;
let cells = Array(9).fill("");
let turn = "X";
let gameOver = false;

function showOnline() {
  document.getElementById("online").hidden = false;
  document.getElementById("local").hidden = true;

  if (!socket) {
    socket = io(BACKEND_URL);

    socket.on("room-created", data => {
      currentRoom = data.roomId;
      document.getElementById("roomStatus").textContent =
        "Room ID: " + data.roomId + " | Waiting for players";
    });

    socket.on("room-joined", data => {
      currentRoom = data.roomId;
      document.getElementById("roomStatus").textContent =
        "Joined Room: " + data.roomId;
    });

    socket.on("player-joined", data => {
      document.getElementById("roomStatus").textContent =
        "Players in room: " + data.players;
    });

    socket.on("error-message", message => {
      document.getElementById("roomStatus").textContent = message;
    });
  }
}

function createRoom() {
  if (!socket) showOnline();

  const name = document.getElementById("playerName").value.trim();
  const count = Number(document.getElementById("playerCount").value);

  if (!name) return alert("Enter your name first!");

  socket.emit("create-room", { name, count });
}

function joinRoom() {
  if (!socket) showOnline();

  const name = document.getElementById("playerName").value.trim();
  const roomId = document.getElementById("roomId").value.trim();

  if (!name || !roomId) {
    return alert("Enter name and Room ID!");
  }

  socket.emit("join-room", { name, roomId });
}

function startLocal(count) {
  localPlayers = count;
  document.getElementById("online").hidden = true;
  document.getElementById("local").hidden = false;

  document.getElementById("localTitle").textContent =
    count + " Player Local Mode";

  document.getElementById("gameStatus").textContent =
    "Select a game to play!";
}

function startTicTacToe() {
  if (localPlayers !== 2) {
    alert("Tic Tac Toe is a 2-player game. Please choose 2 Player Mode.");
    return;
  }

  cells = Array(9).fill("");
  turn = "X";
  gameOver = false;
  drawBoard();
}

function drawBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";

  cells.forEach((value, index) => {
    const button = document.createElement("button");
    button.className = "cell";
    button.textContent = value;
    button.onclick = () => makeMove(index);
    board.appendChild(button);
  });

  document.getElementById("gameStatus").textContent =
    gameOver ? document.getElementById("gameStatus").textContent :
    "Player " + turn + " Turn";
}

function makeMove(index) {
  if (cells[index] || gameOver) return;

  cells[index] = turn;

  const wins = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];

  const won = wins.some(line =>
    line.every(i => cells[i] === turn)
  );

  if (won) {
    gameOver = true;
    document.getElementById("gameStatus").textContent =
      "🎉 Player " + turn + " Wins!";
  } else if (cells.every(cell => cell)) {
    gameOver = true;
    document.getElementById("gameStatus").textContent = "Match Draw!";
  } else {
    turn = turn === "X" ? "O" : "X";
  }

  drawBoard();
}

