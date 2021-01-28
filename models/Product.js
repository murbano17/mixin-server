const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  id: Number,
  brand: String,
  name: String,
  price: String,
  price_sign: String,
  currency: String,
  image_link: String,
  product_link: String,
  website_link: String,
  description: String,
  rating: String,
  category: String,
  product_type: String,
  tag_list: Array,
  created_at: String,
  updated_at: String,
  product_api_url: String,
  api_featred_image: String,
  product_colors: [{ hex_value: String, colour_name: String }],
});

const User = mongoose.model("Product", productSchema);

module.exports = User;
