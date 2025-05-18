const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const session = require("express-session");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const usersFile = "data/users.json";
const messagesFile = "data/messages.json";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "limonee-secret",
  resave: false,
  saveUninitialized: false
}));

// Helper functies
function loadUsers() {
  if (!fs.existsSync(usersFile)) return {};
  return JSON.parse(fs.readFileSync(usersFile));
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function loadMessages() {
  if (!fs.existsSync(messagesFile)) return [];
  return JSON.parse(fs.readFileSync(messagesFile));
}

function saveMessages(messages) {
  fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

// Routes
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();

  if (users[username]) {
    return res.send("Gebruiker bestaat al.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users[username] = { password: hashedPassword, friends: [], requests: [] };
  saveUsers(users);
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();

  if (!users[username]) return res.send("Gebruiker bestaat niet.");

  const match = await bcrypt.compare(password, users[username].password);
  if (!match) return res.send("Wachtwoord incorrect.");

  req.session.user = username;
  res.redirect("/dashboard");
});

app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const users = loadUsers();
  const user = users[req.session.user];
  const username = req.session.user;
  const friends = user.friends || [];
  const requests = user.requests || [];
  res.render("dashboard", { username, users, friends, requests });
});

app.post("/add-friend", (req, res) => {
  const { friend } = req.body;
  const users = loadUsers();
  const user = req.session.user;

  if (users[friend] && friend !== user && !users[friend].requests.includes(user)) {
    users[friend].requests.push(user);
    saveUsers(users);
  }

  res.redirect("/dashboard");
});

app.post("/accept-friend", (req, res) => {
  const { requester } = req.body;
  const users = loadUsers();
  const user = req.session.user;

  if (users[user].requests.includes(requester)) {
    users[user].requests = users[user].requests.filter(r => r !== requester);
    users[user].friends.push(requester);
    users[requester].friends.push(user);
    saveUsers(users);
  }

  res.redirect("/dashboard");
});

app.get("/chat/:friend", (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect("/login");

  const friend = req.params.friend;
  const users = loadUsers();

  if (!users[user].friends.includes(friend)) return res.send("Geen toegang tot chat.");

  const messages = loadMessages().filter(
    m =>
      (m.sender === user && m.receiver === friend) ||
      (m.sender === friend && m.receiver === user)
  );

  res.render("chat", { username: user, friend, messages });
});

// Socket.io
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, friend }) => {
    const room = [username, friend].sort().join("-");
    socket.join(room);
    socket.room = room;
  });

  socket.on("sendMessage", ({ sender, receiver, message }) => {
    const room = [sender, receiver].sort().join("-");
    const messages = loadMessages();
    messages.push({ sender, receiver, message });
    saveMessages(messages);
    io.to(room).emit("receiveMessage", { sender, message });
  });
});

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server gestart op poort ${port}`));
