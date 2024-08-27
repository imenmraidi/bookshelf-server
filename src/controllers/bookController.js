const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const Book = require("../models/Book");
const Shelf = require("../models/Shelf");
const axios = require("axios");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose"); // Import mongoose
require("dotenv").config();

const searchBook = async (req, res) => {
  const { search } = req.params;
  try {
    const books = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${search}&key=${process.env.API_KEY}`
    );
    if (!(books.data.totalItems > 0)) res.status(200).json([]);
    else {
      const items = books.data.items.map(item => {
        return {
          code: item?.id,
          title: item.volumeInfo?.title,
          authors: item.volumeInfo?.authors,
          pageCount: item.volumeInfo?.pageCount,
          cover: item.volumeInfo?.imageLinks?.thumbnail,
          publishedDate: item.volumeInfo?.publishedDate,
          description: item.volumeInfo?.description,
        };
      });
      res.status(200).json(items);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
};
const getBooks = async (req, res) => {
  const { userId } = req.params;
  try {
    const books = await Book.find({ userId });
    if (!books || books.length === 0) {
      return res
        .status(404)
        .json({ error: "No books found with the specified userId" });
    }
    res.status(200).json(books);
  } catch (error) {
    res.status(500).send({ error });
  }
};

const addBooks = async (req, res) => {
  const { books, shelf, status, userId, newShelf } = req.body;
  try {
    // Check if any of the books already exist
    const existingBooks = await Book.find({
      code: { $in: books.map(book => book.code) },
    });

    if (existingBooks.length > 0) {
      const existingTitles = existingBooks.map(book => book.title);
      return res.status(400).json({
        error: `Books with titles "${existingTitles.join(", ")}" already exist`,
      });
    }
    let addedShelf = shelf;
    if (newShelf === true) {
      const currentShelves = await Shelf.find({ userId, status });
      const newshelf = new Shelf({
        userId,
        shelfName: shelf,
        shelfIndex: currentShelves.length,
        status,
      });
      await newshelf.save();
      addedShelf = newshelf._id;
    }

    let currentIndex;
    // Calculate the starting index for the new books
    const booksInShelf = await Book.find({
      shelfId: addedShelf,
      status,
      userId,
    });
    currentIndex = booksInShelf.length;

    // Add the calculated index
    const newBooks = books.map((book, i) => ({
      ...book,
      shelfId: addedShelf,
      status,
      userId,
      index: currentIndex + i,
    }));

    // Insert the new books into the database
    const insertedBooks = await Book.insertMany(newBooks);
    const addedShelfInfo = await Shelf.findById(addedShelf);

    res.status(200).json({
      addedShelf: {
        _id: addedShelfInfo._id,
        shelf: addedShelfInfo.shelfName,
        shelfIndex: addedShelfInfo.shelfIndex,
        status: addedShelfInfo.status,
        books: insertedBooks,
      },
    });
  } catch (error) {
    res.status(500).send({ error });
  }
};

const groupBooksByShelf = async (req, res) => {
  try {
    const { userId } = req.body;

    const shelvesWithBooks = await Shelf.aggregate([
      { $match: { userId: userId } }, // Match shelves by userId
      {
        $lookup: {
          from: "books", // Join with the books collection
          localField: "_id", // Match shelfId in books
          foreignField: "shelfId",
          as: "books", // Store matched books in an array named 'books'
        },
      },
      {
        $addFields: {
          books: {
            $sortArray: { input: "$books", sortBy: { index: 1 } }, // Sort books by index within each shelf
          },
        },
      },
      {
        $project: {
          // Project the desired fields for the response
          _id: 1, // Include the shelf's _id
          shelf: "$shelfName",
          status: 1,
          shelfIndex: 1,
          books: {
            _id: 1,
            code: 1,
            title: 1,
            authors: 1,
            pageCount: 1,
            publishedDate: 1,
            description: 1,
            cover: 1,
            shelfId: 1,
            startedAt: 1,
            finishedAt: 1,
            rating: 1,
            notes: 1,
            status: 1,
            tag: 1,
            hide: 1,
          },
        },
      },
    ]);

    res.status(200).json(shelvesWithBooks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
const addShelf = async (req, res) => {
  const { userId, status, name } = req.body;
  try {
    const currentShelves = await Shelf.find({ userId, status });
    const newShelf = new Shelf({
      userId,
      shelfName: name,
      shelfIndex: currentShelves.length,
      status,
    });
    await newShelf.save();
    res.status(200).json({ newShelf: newShelf });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const updateBook = async (req, res) => {
  const { id } = req.params;
  const { book, over } = req.body;
  try {
    let updatedBook;
    if (!over) {
      updatedBook = await Book.findByIdAndUpdate(
        id,
        {
          $set: {
            ...book,
          },
        },
        { new: true } // Return the updated document
      );
    } else if (over) {
      if (over.switchShelf !== null) {
        const activeBookIndex = await Book.findById(id, { index: 1 });
        await Book.updateMany(
          {
            shelfId: over.switchShelf,
            index: { $gt: activeBookIndex.index },
          },
          {
            $inc: { index: -1 },
          }
        );
      }
      if (over?.type === "book") {
        if (over.index > book.index) {
          // If a > b, increment all books with index < a and >= b by 1
          await Book.updateMany(
            {
              index: { $gte: book.index, $lt: over.index },
              _id: { $ne: id },
              shelfId: book.shelfId,
              status: book.status,
            },
            {
              $inc: { index: 1 },
            }
          );
        } else if (over.index < book.index) {
          // If a < b, decrement all books with index > a and <= b by 1
          await Book.updateMany(
            {
              index: { $gt: over.index, $lte: book.index },
              _id: { $ne: id },
              shelfId: book.shelfId,
              status: book.status,
            },
            {
              $inc: { index: -1 },
            }
          );
        }
        updatedBook = await Book.findByIdAndUpdate(
          id,
          {
            $set: {
              ...book,
            },
          },
          { new: true } // Return the updated document
        );
      } else if (over?.type === "shelf") {
        const booksInShelf = await Book.find({
          shelfId: book.shelfId,
          status: book.status,
        });
        let newIndex = booksInShelf.length;
        updatedBook = await Book.findByIdAndUpdate(
          id,
          {
            $set: {
              ...{ ...book, index: newIndex },
            },
          },
          { new: true } // Return the updated document
        );
      }
    }
    if (!updatedBook) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ error: "Error updating book" });
  }
};
const updateShelfIndex = async (req, res) => {
  const { id } = req.params;
  const { activeIndex, overIndex, userId, status } = req.body;
  try {
    if (activeIndex > overIndex) {
      // If a > b, increment all books with index < a and >= b by 1
      await Shelf.updateMany(
        {
          shelfIndex: { $gte: overIndex, $lt: activeIndex },
          _id: { $ne: id },
          userId: userId,
          status: status,
        },
        {
          $inc: { shelfIndex: 1 },
        }
      );
    } else if (activeIndex < overIndex) {
      // If a < b, decrement all books with index > a and <= b by 1
      await Shelf.updateMany(
        {
          shelfIndex: { $gt: activeIndex, $lte: overIndex },
          _id: { $ne: id },
          userId: userId,
          status: status,
        },
        {
          $inc: { shelfIndex: -1 },
        }
      );
    }
    updatedShelf = await Shelf.findByIdAndUpdate(
      id,
      {
        $set: {
          shelfIndex: overIndex,
        },
      },
      { new: true }
    );
    res.status(200).json(updatedShelf);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update shelf index", error: error.message });
  }
};
const renameShelf = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    await Shelf.findByIdAndUpdate(id, { shelfName: name });
    res.status(200).send("shelf updated successfully");
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while deleting the shelf" });
  }
};
const deleteBook = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the book to delete
    const toDeleteBook = await Book.findById(id);
    if (!toDeleteBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Decrement the index of all books that come after the deleted one on the same shelf
    await Book.updateMany(
      {
        index: { $gt: toDeleteBook.index },
        userId: toDeleteBook.userId,
        shelfId: toDeleteBook.shelfId,
      },
      {
        $inc: { index: -1 },
      }
    );

    // Delete the book
    const deletedBook = await Book.findByIdAndDelete(id);

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the book" });
  }
};

const deleteShelf = async (req, res) => {
  const { id } = req.params;
  try {
    const toDeleteShelf = await Shelf.findById(id);
    if (!toDeleteShelf) {
      return res.status(404).json({ error: "Shelf not found" });
    }

    await Shelf.updateMany(
      {
        shelfIndex: { $gt: toDeleteShelf.shelfIndex },
        userId: toDeleteShelf.userId,
        status: toDeleteShelf.status,
      },
      {
        $inc: { shelfIndex: -1 },
      }
    );
    await Book.deleteMany({
      shelfId: toDeleteShelf._id,
    });
    const deletedShelf = await Shelf.findOneAndDelete({ _id: id });

    res.status(200).json(deletedShelf);
  } catch (error) {
    res.status(500).send({ error });
  }
};

module.exports = {
  searchBook,
  addBooks,
  groupBooksByShelf,
  deleteBook,
  deleteShelf,
  getBooks,
  addShelf,
  renameShelf,
  updateBook,
  updateShelfIndex,
};
