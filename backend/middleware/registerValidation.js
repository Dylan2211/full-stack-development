const Joi = require("joi");

const registerSchema = Joi.object({
  fullName: Joi.string().min(3).max(100).required().messages({
    "string.base": "Full name must be a string",
    "string.empty": "Full name cannot be empty",
    "string.min": "Full name must be at least 3 characters",
    "string.max": "Full name must be at most 100 characters",
    "any.required": "Full name is required",
  }),
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    "string.email": "Email must be valid",
    "string.empty": "Email cannot be empty",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain uppercase, lowercase and number",
      "string.min": "Password must be at least 8 characters",
      "any.required": "Password is required",
    }),
});

function validateRegistration(req, res, next) {
  if (req.body.fullname && !req.body.fullName) req.body.fullName = req.body.fullname;
  if (req.body.email && typeof req.body.email === "string") req.body.email = req.body.email.trim().toLowerCase();

  const { error } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Validation error", errors });
  }
  req.validatedBody = req.body;
  next();
}

module.exports = { validateRegistration };
