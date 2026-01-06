const Joi = require("joi");

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password cannot be empty",
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.pattern.base": "Password must contain uppercase, lowercase and number",
      "string.min": "Password must be at least 8 characters",
      "any.required": "New password is required",
    }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({ "any.required": "Token is required" }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.pattern.base": "Password must contain uppercase, lowercase and number",
      "string.min": "Password must be at least 8 characters",
      "any.required": "New password is required",
    }),
});

function validateChangePassword(req, res, next) {
  const { error, value } = changePasswordSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Validation error", errors });
  }
  req.validatedBody = value;
  next();
}

function validateResetPassword(req, res, next) {
  const { error, value } = resetPasswordSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Validation error", errors });
  }
  req.validatedBody = value;
  next();
}

module.exports = { validateChangePassword, validateResetPassword };