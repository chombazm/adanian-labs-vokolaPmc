const Joi = require("joi");

const login = (data) => {
  const Schema = Joi.object({
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    }),
    password: Joi.string().required().min(5).max(1024),
  });

  return Schema.validate(data);
};

const register = (data) => {
  const Schema = Joi.object({
    username: Joi.string().required().min(3).max(25),
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    }),
    password: Joi.string().required().default("123456").min(5).max(1024),
    status: Joi.string().default("pending verification"),
    activation_token: Joi.string(),
    date: Joi.date().default(Date.now),
  });

  return Schema.validate(data);
};

module.exports = {
  login,
  register,
};
