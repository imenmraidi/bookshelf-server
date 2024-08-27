const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// const bookSchema = new mongoose.Schema({
//   code: { type: String, required: true },
//   title: { type: String, required: true },
//   authors: { type: [String], required: true },
//   pageCount: { type: Number },
//   publishedDate: { type: [String], required: true },
//   description: { type: String },
//   cover: { type: String, required: true },
//   userId: { type: String, required: true },
//   startedAt: { type: String },
//   finishedAt: { type: String },
//   rating: { type: Number },
//   notes: { type: String },
//   status: { type: String },
//   shelf: { type: String },
//   tag: { type: String },
//   hide: { type: Boolean, default: false },
//   index: { type: Number },
//   shelfIndex: { type: Number },
// });
const bookSchema = new mongoose.Schema({
  code: { type: String, required: true },
  title: { type: String, required: true },
  authors: { type: [String], required: true },
  pageCount: { type: Number },
  publishedDate: { type: String, required: true },
  description: { type: String },
  cover: { type: String, required: true },
  userId: { type: String, required: true },
  shelfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shelf",
    required: true,
  }, // Reference to the Shelf
  startedAt: { type: String },
  finishedAt: { type: String },
  rating: { type: Number },
  notes: { type: String },
  status: { type: String }, // Book-specific status, if different from the shelf's status
  tag: { type: String },
  hide: { type: Boolean, default: false },
  index: { type: Number }, // Index within the shelf
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
