const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const User = require("../models/user");
const catchAsync = require("../middlewares/catchAsync");
const { userValidation } = require("../validation");
const config = require("../config/config");
const { registrationEmail, forgotPasswordEmail } = require("../services/email");

const {
  registerValidation,
  loginValidation,
  requestVerificationValidation,
  activateValidation,
} = require("../validation/");

const login = catchAsync(async (req, res) => {
  const { error } = userValidation.login(req.body);

  if (error) return res.status(400).send({ message: error.details[0].message });

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send({ message: "Credentials mismatch!" });

  //check if user is verified
  if (user.status === "pending verification") {
    return res
      .status(401)
      .send({ message: "Please activate your accout to login" });
  } else if (user.status === "deactivated") {
    return res
      .status(403)
      .send({ message: "Your account has been deactivated" });
  } else if (user.status === "active") {
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword)
      return res.status(401).send({ message: "Credentials mismatch!" });
    console.log(user._id, "get user before signing token");

    //create json web token
    const token = jwt.sign({ _id: user._id }, config.jwt.tokenSecret);

    const sendUserData = {
      id: user._id,
      username: user.username,
      email: user.email,
      dateRegistered: user.date,
    };
    res.status(200).json({ user: sendUserData, token });
  }
});

const register = catchAsync(async (req, res) => {
  const { error } = userValidation.register(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist)
    return res.status(400).send({ message: "Email already exist" });

  const reset_token = nanoid(20);

  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    activation_token: reset_token,
    status: "pending verification",
  });

  try {
    // registration email contains the activation token
    registrationEmail(req, reset_token);
    const savedUser = await user.save();
    // [todo] send activation link
    // ! remove activation token from user
    return res.status(200).json({
      code: 200,
      activation_code: user.activation_token,
      email: user.email,
    });
  } catch (err) {
    // console.log(err, "error in register");
    return res.status(400).send(err);
  }
});

const requestVerification = catchAsync(async (req, res) => {
  const { error } = requestVerificationValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const userExist = await User.findOne({ email: req.body.email });

  if (!userExist)
    return res
      .status(401)
      .send(`No account is associated with ${req.body.email}`);
  if (userExist.status === "deactivated")
    return res.status(401).send("opps,account is blocked.");
  if (!userExist) return res.status(400).send("email isnt registered ");

  const verificationCode = nanoid(20);
  const updatedUser = await User.updateOne(
    { _id: userExist._id },
    { $set: { activation_token: verificationCode } },
    { upsert: true }
  );

  if (!updatedUser)
    return res.status(500).send("Our server is down. try again letter");

  res
    .status(200)
    .send(`Activation has been sent to your email ${userExist.email}`);
});

const activateUser = catchAsync(async (req, res) => {
  const { error } = userValidation.activateAccount(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  const userFromDB = await User.findOne({ email: req.body.email });
  if (!userFromDB)
    return res.status(400).send({ message: "Email isn't registered" });

  if (req.body.activation_token !== userFromDB.activation_token)
    return res.status(400).send({ message: "email and token mismactch" });

  // set password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  const updatedUser = await User.updateOne(
    { _id: userFromDB._id },
    {
      $set: {
        password: hashedPassword,
        activation_token: null,
        status: "active",
      },
    },
    { upsert: true }
  );

  if (!updatedUser)
    return res
      .status(500)
      .send({ message: "Our server is down. try again letter" });

  const refetchUser = await User.findOne(
    { email: req.body.email },
    { password: 0 }
  );

  return res.status(201).json({
    message: "Account activated successfully",
    user: refetchUser,
  });
});

const updateUser = catchAsync(async (req, res) => {
  res.send(`Editing ${req.params.id}`);
});

const forgetPassword = catchAsync(async (req, res) => {
  console.log(req.body.email);
});
const createNewPassword = catchAsync(async (req, res) => {
  console.log(req.body);
});
module.exports = {
  login,
  register,
  requestVerification,
  activateUser,
  updateUser,
  forgetPassword,
  createNewPassword,
};
