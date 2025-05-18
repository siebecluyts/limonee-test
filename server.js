const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const fs = require("fs");
const bcrypt = require("bcrypt");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  session({
    store: new FileStore({ path: "./sessions" }),
    secret: "geheimelimoen",
    resave: false,
    saveUninitialized: true,
  })
);

const USERS_FILE = "data/users.json";
const MSG_FILE = "data/messages.json";

// Zorg dat de json-bestanden bestaan
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "{}");
if (!fs.existsSync(MSG_FILE)) fs.writeFileSync(MSG_FILE, "{}");

function readUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function writeUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function readMessages() {
  return JSON.parse(fs.readFileSync(MSG_FILE, "utf8"));
}

function writeMessages(data) {
  fs.writeFileSync(MSG_FILE, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
  if (req.session.username) return res.redirect("/dashboard");
  res.render("login", { error: null });
});

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  if (users[username]) {
    return res.render("register", { error: "Gebruiker bestaat al." });
  }

  const hash = await bcrypt.hash(password, 10);
  users[username] = {
    password: hash,
    friends: [],
    requests: [],
  };
  writeUsers(users);

  req.session.username = username;
  res.redirect("/dashboard");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users[username];

  if (!user) return res.render("login", { error: "Gebruiker bestaat niet." });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.render("login", { error: "Wachtwoord incorrect." });

  req.session.username = username;
  res.redirect("/dashboard");
});

app.get("/dashboard", (req, res) => {
  const username = req.session.username;
  if (!username) return res.redirect("/");

  const users = readUsers();
  const user = users[username];
  const messages = readMessages();

  const newMessageCounts = {};
  user.friends.forEach((f) => {
    const chat = messages[username]?.[f] || [];
    const unread = chat.filter((m) => !m.read && m.to === username);
    if (unread.length > 0) newMessageCounts[f] = unread.length;
  });

  res.render("dashboard", {
    username,
    friends: user.friends,
    requests: user.requests,
    error: null,
    newMessageCounts,
  });
});

app.post("/friend-request", (req, res) => {
  const sender = req.session.username;
  const receiver = req.body.receiver;
  const users = readUsers();

  if (!users[receiver]) {
    return res.render("dashboard", {
      username: sender,
      friends: users[sender].friends,
      requests: users[sender].requests,
      error: "Gebruiker bestaat niet.",
      newMessageCounts: {},
    });
  }

  if (users[receiver].requests.includes(sender) || users[receiver].friends.includes(sender)) {
    return res.redirect("/dashboard");
  }

  users[receiver].requests.push(sender);
  writeUsers(users);
  res.redirect("/dashboard");
});

app.post("/accept-friend", (req, res) => {
  const sender = req.body.sender;
  const receiver = req.session.username;
  const users = readUsers();

  users[receiver].friends.push(sender);
  users[sender].friends.push(receiver);

  users[receiver].requests = users[receiver].requests.filter((u) => u !== sender);

  writeUsers(users);
  res.redirect("/dashboard");
});

app.post("/decline-friend", (req, res) => {
  const sender = req.body.sender;
  const receiver = req.session.username;
  const users = readUsers();

  users[receiver].requests = users[receiver].requests.filter((u) => u !== sender);
  writeUsers(users);
  res.redirect("/dashboard");
});

app.get("/chat/:friend", (req, res) => {
  const user = req.session.username;
  const friend = req.params.friend;

  if (!user) return res.redirect("/");

  const users = readUsers();
  const messages = readMessages();

  if (!users[user].friends.includes(friend)) return res.redirect("/dashboard");

  const chat = messages[user]?.[friend] || [];

  // Markeer ontvangen berichten als gelezen
  chat.forEach((m) => {
    if (m.to === user) m.read = true;
  });

  if (!messages[user]) messages[user] = {};
  messages[user][friend] = chat;
  if (!messages[friend]) messages[friend] = {};
  if (!messages[friend][user]) messages[friend][user] = chat;

  writeMessages(messages);

  res.render("chat", {
    user,
    friend,
    messages: chat,
  });
});

app.post("/chat/:friend", (req, res) => {
  const from = req.session.username;
  const to = req.params.friend;
  const text = req.body.text;
  const time = Date.now();

  if (!from) return res.redirect("/");

  const messages = readMessages();

  if (!messages[from]) messages[from] = {};
  if (!messages[to]) messages[to] = {};
  if (!messages[from][to]) messages[from][to] = [];
  if (!messages[to][from]) messages[to][from] = [];

  const msg = { from, to, text, time, read: false };

  messages[from][to].push(msg);
  messages[to][from].push(msg);

  writeMessages(messages);

  res.redirect(`/chat/${to}`);
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

io.on("connection", (socket) => {
  socket.on("join", (username) => {
    socket.join(username);
  });

  socket.on("send-message", (data) => {
    const { from, to, text } = data;
    const time = Date.now();
    const msg = { from, to, text, time, read: false };

    const messages = readMessages();
    if (!messages[from]) messages[from] = {};
    if (!messages[to]) messages[to] = {};
    if (!messages[from][to]) messages[from][to] = [];
    if (!messages[to][from]) messages[to][from] = [];

    messages[from][to].push(msg);
    messages[to][from].push(msg);
    writeMessages(messages);

    io.to(to).emit("receive-message", msg);
    io.to(from).emit("receive-message", msg);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server gestart op http://localhost:3000");
});
