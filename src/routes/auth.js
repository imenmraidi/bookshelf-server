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
router.post("/logout",auth, Controller.logout);
router.post("/refreshToken", Controller.refreshToken);
router.put("/updateUsername/:id",auth, Controller.updateUsername);
router.put("/updatePassword/:id",auth, Controller.updatePassword);

module.exports = router;
