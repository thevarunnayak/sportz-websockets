import express from "express";
import { matchRouter } from "./routes/matches.js";
import http from 'http';
import { attachWebSocketServer } from "./ws/server.js";
import { securityMiddleware } from "./arcjet.js";
import { commentaryRouter } from "./routes/commentary.js";

const app = express();
const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || '0.0.0.0';


// parse JSON request bodies
app.use(express.json());

const server = http.createServer(app);

// root route
app.get("/", (req, res) => {
  res.send({ message: "Welcome to Sportz API!" });
});

app.use(securityMiddleware());

app.use("/matches", matchRouter);
app.use('/matches/:id/commentary', commentaryRouter);

const { broadcastMatchCreated, broadcastCommentary } = attachWebSocketServer(server);

app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;



server.listen(PORT,HOST, () => {
  const baseUrl = HOST === '0.0.0.0' ?  `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server is running at ${baseUrl}`);
  console.log(`WebSocket Server is running on ${baseUrl.replace('http', 'ws')}/ws`);
});
