const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const User = require("../models/user");
const catchAsync = require("../middlewares/catchAsync");
const { userValidation } = require("../validation");

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
    // res.header('authorization-token', token).send(token);
    const sendUserData = {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      dateRegistered: user.date,
      v_guid: user.v_guid,
      v_access_token: user.v_access_token,
      v_reference: user.v_reference,
    };
    res.status(200).json({ user: sendUserData, token });
    // res.status(200).send(token);
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
  const { error } = activateValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const userFromDB = await User.findOne({ email: req.body.email });
  if (!userFromDB) return res.status(400).send("Email isn't registered ");

  if (req.body.activation_code !== userFromDB.activation_token)
    return res.status(400).send("email and token mismactch");

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
    return res.status(500).send("Our server is down. try again letter");

  const codeToAddToRefUser = nanoid(20);

  const url = "https://api.vitalsource.com/v3/users.xml";
  const reference_user_id = `esiaccess_${userFromDB._id}`;
  const xmlDataBodyReq = `<?xml version="1.0" encoding="UTF-8"?><user>
	    <reference>${reference_user_id}</reference>
	    <first-name>${userFromDB.firstname}</first-name>
	    <last-name>${userFromDB.lastname}</last-name>
        </user>	`;
  var config = {
    headers: {
      "Content-Type": "text/xml",
      "X-VitalSource-API-Key": config.vitalSource.apiKey,
    },
  };

  const { data } = await axios.post(url, xmlDataBodyReq, config);

  function parseXml(xml) {
    return new Promise((resolve, reject) => {
      parseString(xml, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
  async function processResult(result) {
    const addVitalsourceCredsToUser = await User.updateOne(
      { _id: result.id },
      {
        $set: {
          v_guid: result.guid,
          v_access_token: result.accessToken,
          v_reference: result.reference_user_id,
        },
      },
      { upsert: true }
    );
  }
  async function testXmlParse(xml, id, ref) {
    try {
      let result = await parseXml(xml);
      // Clean data and fetch out what we need { email, firtstname, lastname, guid,   }
      console.log(result, "vikali");
      const cleanedResult = {
        id: id,
        email: result.user.email[0],
        firstname: result.user["first-name"][0],
        lastname: result.user["last-name"][0],
        accessToken: result.user["access-token"][0],
        reference_user_id: ref,
        guid: result.user.guid[0],
      };
      processResult(cleanedResult);
      // return res.json(cleanedResult);
    } catch (err) {
      console.error("parseXml failed: ", err);
    }
  }
  const checkkers = await testXmlParse(data, userFromDB._id, reference_user_id);

  //this is prolly not needed but will take a look later
  const refetchUser = await User.findOne({ email: req.body.email });

  return res.json(refetchUser);
});
const updateUser = catchAsync(async (req, res) => {
  res.send(`Editing ${req.params.id}`);
});

const forgetPassword = catchAsync(async (req, res) => {
  console.log(req.body.email);
  // const { error } = forgetPasswordValidation(req.body);
  // if (error) return res.status(400).send(error.details[0].message);
  if (!req.body.email) return res.status(400).send("email is required");
  const userFromDB = await User.findOne({ email: req.body.email });
  if (!userFromDB) return res.status(400).send("Email isn't registered ");

  const verificationCode = nanoid(20);
  const updatedUser = await User.updateOne(
    { _id: userFromDB._id },
    { $set: { activation_token: verificationCode } },
    { upsert: true }
  );

  if (!updatedUser)
    return res.status(500).send("Our server is down. try again letter");

  forgotPasswordEmail(userFromDB.email, verificationCode);
  res
    .status(200)
    .send(`Reset password has been sent to your email ${userFromDB.email}`);
});
const createNewPassword = catchAsync(async (req, res) => {
  // const { error } = activateValidation(req.body);
  // if (error) return res.status(400).send(error.details[0].message);
  const request_token =
    req.body.request_token || req.query.request_token || null;
  const email = req.body.email || req.query.email || null;
  const password = req.body.password || req.query.password || null;

  if (!request_token || !email || !password)
    return res
      .status(400)
      .send("all fields are required. email, password and request_token");

  const userFromDB = await User.findOne({
    email: req.body.email,
  });
  if (!userFromDB)
    return res
      .status(400)
      .send("Invalid activation code, request password reset!");
  console.log(request_token, userFromDB.activation_token, "compare token");
  if (request_token !== userFromDB.activation_token)
    return res.status(400).send("email and token mismactch");

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
    return res.status(500).send("Our server is down. try again letter");

  return res.status(200).send("Password has been changed");
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
