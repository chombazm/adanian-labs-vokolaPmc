const express = require("express");
const { userController } = require("../controllers/");
const router = express.Router();

router.post("/login", userController.login);
router.post("/register", userController.register);
router.patch("/activate", userController.activateUser);

module.exports = router;
