import express from "express";

const app = express();
const PORT = 8000;

// parse JSON request bodies
app.use(express.json());

// root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Sportz API!" });
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Server is running at ${url}`);
});
