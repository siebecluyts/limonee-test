const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const fs = require("fs");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/styles.css", express.static(path.join(__dirname, "public", "styles.css")));

app.use(session({
  secret: "limonee-geheim",
  resave: false,
  saveUninitialized: false
}));

const USERS_FILE = "data/users.json";
const MESSAGES_FILE = "data/messages.json";

function loadUsers() {
  return fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : {};
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function loadMessages() {
  return fs.existsSync(MESSAGES_FILE) ? JSON.parse(fs.readFileSync(MESSAGES_FILE)) : {};
}

function saveMessages(messages) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

app.get("/", (req, res) => {
  if (req.session.username) {
    res.redirect("/dashboard");
  } else {
    res.render("index");
  }
});

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  if (users[username]) {
    return res.render("register", { error: "Gebruikersnaam bestaat al." });
  }
  const hashed = await bcrypt.hash(password, 10);
  users[username] = { password: hashed, friends: [], requests: [] };
  saveUsers(users);
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users[username];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render("login", { error: "Ongeldige inloggegevens." });
  }
  req.session.username = username;
  res.redirect("/dashboard");
});

app.get("/dashboard", (req, res) => {
  const username = req.session.username;
  if (!username) return res.redirect("/login");

  const users = loadUsers();
  const user = users[username];
  const messages = loadMessages();

  // Bereken aantal nieuwe berichten van elke vriend
  const newMessageCounts = {};
  if (messages[username]) {
    for (const m of messages[username]) {
      if (!newMessageCounts[m.from]) {
        newMessageCounts[m.from] = 0;
      }
      newMessageCounts[m.from]++;
    }
  }

  res.render("dashboard", {
    username,
    friends: user.friends,
    requests: user.requests,
    error: null,
    newMessageCounts
  });
});

app.post("/friend-request", (req, res) => {
  const sender = req.session.username;
  const receiver = req.body.receiver;
  const users = loadUsers();

  if (!users[receiver]) {
    return res.render("dashboard", {
      username: sender,
      friends: users[sender].friends,
      requests: users[sender].requests,
      error: "Gebruiker bestaat niet.",
      newMessageCounts: {}
    });
  }

  if (!users[receiver].requests.includes(sender)) {
    users[receiver].requests.push(sender);
    saveUsers(users);
  }

  res.redirect("/dashboard");
});

app.post("/accept-friend", (req, res) => {
  const receiver = req.session.username;
  const sender = req.body.sender;
  const users = loadUsers();

  if (!users[receiver].friends.includes(sender)) {
    users[receiver].friends.push(sender);
  }
  if (!users[sender].friends.includes(receiver)) {
    users[sender].friends.push(receiver);
  }

  users[receiver].requests = users[receiver].requests.filter(r => r !== sender);
  saveUsers(users);
  res.redirect("/dashboard");
});

app.post("/decline-friend", (req, res) => {
  const receiver = req.session.username;
  const sender = req.body.sender;
  const users = loadUsers();

  users[receiver].requests = users[receiver].requests.filter(r => r !== sender);
  saveUsers(users);
  res.redirect("/dashboard");
});

app.get("/chat/:friend", (req, res) => {
  const user = req.session.username;
  const friend = req.params.friend;
  if (!user) return res.redirect("/login");

  const messages = loadMessages();
  const history = messages[user]?.filter(
    m => m.from === friend || m.to === friend
  ) || [];

  // Wis nieuwe berichten van deze vriend
  messages[user] = (messages[user] || []).filter(m => m.from !== friend);
  saveMessages(messages);

  res.render("chat", { user, friend, messages: history });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Socket.IO
io.on("connection", socket => {
  let currentUser = null;

  socket.on("join", username => {
    currentUser = username;
    socket.join(username);
  });

  socket.on("send-message", data => {
    const time = Date.now();
    const msg = { from: data.from, to: data.to, text: data.text, time };

    const messages = loadMessages();
    if (!messages[data.to]) messages[data.to] = [];
    messages[data.to].push(msg);
    saveMessages(messages);

    io.to(data.to).emit("receive-message", msg);
    io.to(data.from).emit("receive-message", msg);
  });
});

server.listen(3000, () => console.log("Server gestart op http://localhost:3000"));
