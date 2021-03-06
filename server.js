import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";
import path from "path";
import cors from "cors";
import userControl from "./controller/user.controller.js"
import Log from "./server/log.js";
import pool from "./server/db.js";

let DBRowMessage = {};
let userSenderRoomID = 0;
const onlineUsers = new Map();

const PORT = process.env.PORT || 8080;
const app = express();
const webServer = createServer(app);
const __dirname = path.resolve();
const io = new Server(webServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname))
app.use(express.static(path.join(__dirname, "build")));
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

try {
  app.post("/login", userControl.loginUser);
  app.get("/user/list", userControl.getLoginsUsers);
  app.post("/user", userControl.createUser);
  app.post("/rooms", userControl.getRooms);
  app.post("/chats", userControl.getChats);
  app.post("/invite", userControl.setRoom);
  app.get("/users/online", (req, res) => {
    const usersOnline = [];
    for (const [, login] of onlineUsers.entries()) {
      usersOnline.push(login);
    }
    res.json(usersOnline);
  })

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  })
} catch (e) {
  Log.setLog(`Error in app_post/app_get: ${e}`);
}

try {
  io.on("connection", socket => {
    console.log(`User connected: ${socket.id}`);
    socket.on("online", (login) => {
      onlineUsers.set(socket.id, login);
      console.log(onlineUsers);
      for (const [, login] of onlineUsers.entries()) {
        socket.broadcast.emit("new-online", login);
      }
    })

    socket.on("disconnect", () => {
      console.log(`User disconnect: ${socket.id}`)
      socket.broadcast.emit("disconnect-user", onlineUsers.get(socket.id));
      onlineUsers.delete(socket.id);
    })

    socket.on("send-message", async (values, login, id) => {
      const nowDate = new Date();
      const todayTemplate = `${nowDate
        .getMonth() + 1}/${nowDate
        .getDate()}/${nowDate
        .getFullYear()} ${nowDate
        .getHours()}:${nowDate
        .getMinutes()}:${nowDate
        .getSeconds()}`;
      const sqlForTable = `INSERT INTO chats_${id} (login, message, date)
                           values ($1, $2, $3)
                           RETURNING * `;
      const dbData = await pool.query(sqlForTable, [login, values, todayTemplate]);
      DBRowMessage = dbData.rows[0];
      userSenderRoomID = id;
      socket.to(userSenderRoomID).emit("receive-message", DBRowMessage, userSenderRoomID);
    });

    socket.on("join-room", (roomID) => {
      socket.join(roomID);
    });
  })
} catch (e) {
  Log.setLog(`Error in Socket: ${e}`)
}


try {
  webServer.listen(PORT, (err) => {
    if (err) {
      console.log(err);
      Log.setLog(`${err}`);
    } else {
      Log.setLog(`Server start on ${PORT}`);
    }
  });
} catch (e) {
  Log.setLog(`Error in app.listen: ${e}`);
}
