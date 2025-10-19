const express = require("express");
require("dotenv").config();
const connectDB = require("./db/mongoDB");
const cors = require("cors");
const apiRoute = require("./routes/api.v1.route");
const { initialize } = require("./config/socket");
const PORT = process.env.PORT;

async function start() {
  try {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static("public"));
    app.use("/api/v1", apiRoute);
    const server = require("http").createServer(app);
    initialize(server);
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    await connectDB();
  } catch (error) {
    console.log(`Server error : ${error.message}`);
  }
}
start();
