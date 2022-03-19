const express = require("express");

const app = express();
const PORT = process.env.PORT || 3001;

// midlewares
app.use(express.json()); // parse json

app.listen(PORT, () => {
    console.log("Server listening on port " + PORT);
})