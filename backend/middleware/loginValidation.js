const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    "string.email": "Email must be valid",
    "string.empty": "Email cannot be empty",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password cannot be empty",
    "any.required": "Password is required",
  }),
});

function validateLogin(req, res, next) {
  if (req.body.email && typeof req.body.email === "string") req.body.email = req.body.email.trim().toLowerCase();

  const { error, value } = loginSchema.validate(req.body, { abortEarly: false, allowUnknown: true, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Validation error", errors });
  }
  req.validatedBody = value;
  next();
}

module.exports = { validateLogin };
