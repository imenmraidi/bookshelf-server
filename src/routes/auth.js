var express = require("express");
var cookieParser = require("cookie-parser");
const auth = require("../middleware/authMiddleware");
var app = express();
app.use(cookieParser());
const router = express.Router();
const Controller = require("../controllers/authController");

router.post("/google", Controller.googleLogin);
router.post("/local", Controller.localLogin);
router.post("/signup", Controller.signup);
router.post("/logout", Controller.logout);
router.post("/refreshToken", Controller.refreshToken);
router.put("/updateUsername/:id", Controller.updateUsername);

module.exports = router;
