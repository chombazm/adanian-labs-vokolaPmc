const dotenv = require("dotenv");
const path = require("path");

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(__dirname, "../../.env.local") });
} else {
  dotenv.config({ path: path.join(__dirname, "../.env") });
}

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  app: {
    apiKey: process.env.APP_API_KEY,
  },
  db: {
    connect: process.env.DB_CONNECT_STRING,
  },
  jwt: {
    tokenSecret: process.env.JWT_TOKEN_SECRET,
  },
  sendgrid: {
    apiKey: process.env.SEND_GRID_API_KEY,
    mailFrom: process.env.SEND_FROM_EMAIL,
  },
  frontend: {
    url: process.env.FRONTEND_URL,
  },
};
