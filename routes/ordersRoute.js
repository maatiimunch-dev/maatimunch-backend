const express = require('express');
const { placeOrder, getOrders } = require('../controller/orderController');
const router = express.Router();

router.post('/', placeOrder);
router.get('/', getOrders);

module.exports = router;