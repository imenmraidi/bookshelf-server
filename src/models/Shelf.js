const mongoose = require("mongoose");

const shelfSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  shelfName: { type: String, required: true },
  shelfIndex: { type: Number, required: true },
  status: {
    type: String,
    enum: ["R", "T", "C"],
    required: true,
  },
});

const Shelf = mongoose.model("Shelf", shelfSchema);

module.exports = Shelf;
