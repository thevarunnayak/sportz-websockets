import express from "express";
import { matchRouter } from "./routes/matches.js";

const app = express();
const PORT = 8000;

// parse JSON request bodies
app.use(express.json());

// root route
app.get("/", (req, res) => {
  res.send({ message: "Welcome to Sportz API!" });
});

app.use("/matches", matchRouter);

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Server is running at ${url}`);
});
