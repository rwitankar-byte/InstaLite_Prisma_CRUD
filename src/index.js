const express = require("express");
const prisma = require("./db");
const usersRouter = require("./routes/users.routes");
const postsRouter = require("./routes/posts.routes");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use("/users", usersRouter);
app.use("/posts", postsRouter);

async function startServer() {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;