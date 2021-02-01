require("dotenv").config();

const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const Stripe = require("stripe");

const User = require("../models/User");
const Product = require("../models/Product");
const ShoppingCart = require("../models/ShoppingCart");

// helper functions
const {
  isLoggedIn,
  isNotLoggedIn,
  validationLoggin,
} = require("../helpers/middlewares");

const stripe = new Stripe(process.env.STRIPE_API);

router.get("/", async (req, res, next) => {
  try {
    const allProducts = await Product.find();
    if (allProducts.length == 0) {
      res.status(200).json({ message: "Products are empty" });
      return;
    } else {
      res.status(200).json(allProducts);
      return;
    }
  } catch (error) {
    console.log("Error while getting products");
  }
});

router.get("/cart", isLoggedIn(), async (req, res, next) => {
  try {
    const userId = req.session.currentUser._id;
    const cart = await ShoppingCart.findOne({ user: userId }).populate(
      "products.product"
    );
    res.status(200).json(cart);
  } catch (error) {
    console.log(error);
  }
});

router.post("/addproduct/:id", isLoggedIn(), async (req, res, next) => {
  try {
    const productId = req.params.id;
    const userId = req.session.currentUser._id;

    const userShoppingCart = await ShoppingCart.findOneAndUpdate(
      {
        user: userId,
      },
      { $addToSet: { products: { product: productId, quantity: 1 } } },
      { new: true }
    ).populate("products.product");
    res.status(200).json(userShoppingCart);
  } catch (error) {
    console.log("Error to add the product");
  }
});

router.post("/deleteproduct", isLoggedIn(), async (req, res, next) => {
  try {
    const { _id } = req.body;
    const userId = req.session.currentUser._id;
    const shoppingCart = await ShoppingCart.findOneAndUpdate(
      { user: userId },
      { $pull: { products: { _id: _id } } },
      (err, cart) => {
        if (err) {
          console.log(err);
          return res.send(err);
        }
        res.status(200).json(cart);
      }
    ).populate("products.product");
  } catch (error) {
    console.log("Error to delete the product");
  }
});

router.post("/addquantity", isLoggedIn(), async (req, res, next) => {
  try {
    const _id = req.body._id;
    const quantity = req.body.quantity;
    const userId = req.session.currentUser._id;

    const shoppingCart = await ShoppingCart.findOneAndUpdate(
      {
        user: userId,
        "products._id": _id,
      },

      { $set: { "products.$.quantity": quantity } }
    );
    res.status(200).json(shoppingCart);
  } catch (error) {
    console.log("Error to set the product");
  }
});

router.post("/payment", isLoggedIn(), async (req, res, next) => {
  const { id, amount } = req.body;

  try {
    const payment = await stripe.paymentIntents.create({
      amount,
      currency: "USD",
      description: "Payment",
      payment_method: id,
      confirm: true,
    });

    res.send({ message: "Succesfull payment" });
  } catch (error) {
    console.log(error);
    res.json({ message: error.raw.message });
  }
});

module.exports = router;
