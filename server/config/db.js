const mongoose = require("mongoose");
const config = require("./config");

module.exports = function () {
  mongoose
    .connect(config.db.connect)
    .then(() => console.log("MongoDB connected"))
    .catch((err) =>
      console.log(`MongoDB Not Connected! Something went wrong ${err}`)
    );
};
