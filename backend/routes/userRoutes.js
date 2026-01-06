const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

const { authMiddleware } = require("../middleware/jwtAuth"); 
const { validateRegistration } = require("../middleware/registerValidation");
const { validateLogin } = require("../middleware/loginValidation");
const { validateChangePassword, validateResetPassword } = require("../middleware/passwordValidation");


router.post("/register", validateRegistration, userController.registerUser);
router.post("/login", validateLogin, userController.loginUser);
router.post("/:id/change-password", authMiddleware, validateChangePassword, userController.changePassword);
router.post("/forgot-password", userController.forgotPassword);


router.post("/reset-password", validateResetPassword, userController.resetPassword);

router.get("/", authMiddleware, userController.getAllUsers);

router.get("/:id", authMiddleware, userController.getUserById);

router.put("/:id", authMiddleware, userController.updateUser);

router.delete("/:id", authMiddleware, userController.deleteUser);

module.exports = router;