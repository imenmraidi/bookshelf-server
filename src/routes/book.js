var express = require("express");
var cookieParser = require("cookie-parser");
const auth = require("../middleware/authMiddleware");
var app = express();
app.use(cookieParser());
const router = express.Router();
const Controller = require("../controllers/bookController");

router.get("/search/:search", auth, Controller.searchBook);
router.get("/get/:userId", auth, Controller.getBooks);
router.post("/add", auth, Controller.addBooks);
router.delete("/delete/:id", auth, Controller.deleteBook);
router.delete("/deleteShelf/:id", auth, Controller.deleteShelf);
router.post("/booksByShelf", auth, Controller.groupBooksByShelf);
router.put("/update/:id", auth, Controller.updateBook);
router.put("/updateShelfIndex/:id", auth, Controller.updateShelfIndex);
router.post("/addShelf", auth, Controller.addShelf);
router.put("/renameShelf/:id", auth, Controller.renameShelf);

module.exports = router;
