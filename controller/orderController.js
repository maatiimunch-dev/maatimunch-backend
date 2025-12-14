const Order = require('../model/orderModel');

exports.placeOrder = async (req, res) => {
  const { items, totalAmount } = req.body;
  try {
    const newOrder = new Order({ userId: req.user.userId, items, totalAmount });
    await newOrder.save();
    res.status(201).json({ message: 'Order placed successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getOrders = async (req, res) => {
  const orders = await Order.find({ userId: req.user.userId });
  res.json(orders);
};