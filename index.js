const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./src/config/db"); // Update the path to db.js

const app = express();

//db connection
connectDB();

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

const allowedOrigins = process.env.ALLOWED_ORIGINS || "http://localhost:5173";
app.use(cors({
  origin: allowedOrigins.split(","),
  credentials: true,
}));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use("/api/book", require("./src/routes/book"));
app.use("/api/auth", require("./src/routes/auth"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
