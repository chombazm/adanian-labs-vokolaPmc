const express = require("express");
const connectDb = require("./config/db");
const app = express();
const PORT = process.env.PORT || 3001;
const connectDB = require("./config/db");
var cors = require("cors");

// import routes
const userRoutes = require("./routes/user");

// midlewares
app.use(express.json()); // parse json
app.use(cors()); // allow cors
//connect to db
connectDB();

// initialise routes
app.use("/api/user", userRoutes);

app.listen(PORT, () => {
  //   connectDb();
  console.log("Server listening on port " + PORT);
});
