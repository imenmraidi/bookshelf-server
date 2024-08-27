const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const axios = require("axios");
const bcrypt = require("bcrypt");

const googleLogin = async (req, res) => {
  const { token } = req.body;
  try {
    //get userInfo
    const userInfo = await axios
      .get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => res.data);
    //upsert User
    const user = await User.findOneAndUpdate(
      { email: userInfo.email },
      { $set: { name: userInfo.name, isGoogleUser: true } },
      { new: true, upsert: true }
    );
    // Create tokens
    const tokens = createTokens(user._id);
    // Set refresh token in cookies
    res.cookie("refreshToken", tokens.refreshToken, { httpOnly: true });
    res.status(200).json({
      token: tokens.accessToken,
      user: { id: user._id, name: user.name, isGoogleUser: true },
    });
  } catch (error) {
    console.log(error);
    res.status(401).send({ error });
  }
};
const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }
    const user = new User({ name, email, password });
    await user.save();

    // Create tokens
    const tokens = createTokens(user._id);
    // Set refresh token in cookies
    res.cookie("refreshToken", tokens.refreshToken, { httpOnly: true });
    res.status(200).json({
      token: tokens.accessToken,
      user: { id: user._id, name: user.name },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
};
const localLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("User not found");
    }
    if (!user.password) {
      return res.status(400).send("Account not found");
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).send("Invalid Password");
    }
    // Create tokens
    const tokens = createTokens(user._id);
    // Set refresh token in cookies
    res.cookie("refreshToken", tokens.refreshToken, { httpOnly: true });

    res.status(200).json({
      token: tokens.accessToken,
      user: { id: user._id, name: user.name },
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
};
const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(403).send("Access denied");

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(403).send("Access denied, user not found in DB");
    } else {
      const accessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "15m",
        }
      );
      const obj = user.isGoogleUser
        ? { id: user._id, name: user.name, isGoogleUser: true }
        : { id: user._id, name: user.name };
      res.status(200).send({ token: accessToken, user: { ...obj } });
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(403).send("Access denied, token expired");
    }
    res.status(500).send({ error: error.message });
  }
};
const logout = async (req, res) => {
  res.clearCookie("refreshToken");
  res.sendStatus(200);
};
const updateUsername = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name: name },
      { new: true }
    );
    res.status(200).send("shelf updated successfully");
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
const createTokens = userId => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

module.exports = {
  updateUsername,
  googleLogin,
  localLogin,
  signup,
  logout,
  refreshToken,
};
