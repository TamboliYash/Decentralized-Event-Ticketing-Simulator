const { Router } = require("express");
const { register, login, getMe } = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = Router();

// POST /api/auth/register — public
router.post("/register", register);

// POST /api/auth/login — public
router.post("/login", login);

// GET  /api/auth/me — requires valid JWT
router.get("/me", authMiddleware, getMe);

module.exports = router;
