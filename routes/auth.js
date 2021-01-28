const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const User = require("../models/User");
const ShoppingCart = require("../models/ShoppingCart");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(
  "180040016324-j06hkn7aoj96o96k7068ga2v0gu012bp.apps.googleusercontent.com"
);

// HELPER FUNCTIONS
const {
  isLoggedIn,
  isNotLoggedIn,
  validationLoggin,
} = require("../helpers/middlewares");

//  POST '/signup'

router.post(
  "/signup",
  isNotLoggedIn(),
  validationLoggin(),
  async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
      const emailExists = await User.findOne({ email }, "email");
      if (emailExists) {
        res.status(400).json({ message: "Email already taken" });
      } else {
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashPass = bcrypt.hashSync(password, salt);
        const newUser = await User.create({
          username,
          email,
          password: hashPass,
        });
        const newShoppingCart = await ShoppingCart.create({
          user: newUser._id,
        });
        const addShoppingCart = await User.findByIdAndUpdate(
          newUser._id,
          {
            shoppingCart: newShoppingCart._id,
          },
          { new: true }
        );
        req.session.currentUser = newUser;
        res
          .status(200) //  OK
          .json(newUser);
      }
    } catch (error) {
      console.log("holiii");
      console.log(error);
    }
  }
);

//  POST '/login'

router.post(
  "/login",
  isNotLoggedIn(),
  validationLoggin(),
  async (req, res, next) => {
    const { email, password } = req.body;
    console.log(req.body);
    try {
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ message: "User doesn't exists" });
      } else if (bcrypt.compareSync(password, user.password)) {
        req.session.currentUser = user;
        res.status(200).json(user);
        return;
      } else {
        res.status(401).json({ message: "Email or password are incorrect" });
      }
    } catch (error) {
      console.log(error);
    }
  }
);

// POST '/logout'

router.post("/logout", isLoggedIn(), (req, res, next) => {
  req.session.destroy();
  res.status(204).send();
  return;
});

router.post("/googlelogin", async (req, res, next) => {
  try {
    const { tokenId } = req.body;
    const response = await client.verifyIdToken({
      idToken: tokenId,
      audience:
        "180040016324-j06hkn7aoj96o96k7068ga2v0gu012bp.apps.googleusercontent.com",
    });
    const { email_verified, name, email } = response.payload;

    if (email_verified) {
      await User.findOne({ email }).exec(async (err, user) => {
        if (err) {
          return res.status(400).json({ error: "Something went wrong" });
        } else {
          if (user) {
            req.session.currentUser = user;
            res.status(200).json(user);
          } else {
            const newUser = await User.create({
              username: name,
              email,
            });
            const newShoppingCart = await ShoppingCart.create({
              user: newUser._id,
            });
            const addShoppingCart = await User.findByIdAndUpdate(
              newUser._id,
              {
                shoppingCart: newShoppingCart._id,
              },
              { new: true }
            );
          }
          req.session.currentUser = newUser;
          res.status(200).json(newUser);
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/private", isLoggedIn(), (req, res, next) => {
  res.status(200).json({ message: "Test - User is logged in" });
});

// GET '/me'

router.get("/me", isLoggedIn(), (req, res, next) => {
  req.session.currentUser.password = "*";
  res.json(req.session.currentUser);
});

router.get("/user", isLoggedIn(), async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.session.currentUser._id);
    res.json(currentUser);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
