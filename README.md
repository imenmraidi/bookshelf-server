# Bookshelf - Server
This is the backend API for Bookshelf, a virtual library web application built with the **MERN** stack. It provides secure, token-based authentication and RESTful endpoints to manage users, books, notes, and libraries.
## Tech Stack
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- dotenv for environment variable management
- bcrypt for password hashing
- CORS for cross-origin access
## Getting Started
1. Clone the repo
git clone https://github.com/imenmraidi/bookshelf-server.git
cd bookshelf/server
2. Install dependencies
npm install
3. Set up .env
Create a .env file in the server directory and add:
PORT=5000
MONGO_URI=your_mongo_db_connection_string
JWT_SECRET=your_jwt_secret
4. Start the server
npm run dev
Server will run on http://localhost:5000.
## Authentication
- JWT-based login & registration
- Passwords are hashed using bcrypt
- Tokens are verified via middleware for protected routes
## Features
- Secure user authentication and route protection
- CRUD for books and notes
- Modular, scalable structure
## [Go to the client README](https://github.com/imenmraidi/bookshelf-client)
