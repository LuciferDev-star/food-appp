const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const {
  createBorzoOrderForAppOrder,
  fetchBorzoOrder,
  isBengaluruAddress,
  mapBorzoOrderStatusToAppStatus,
} = require('../services/borzo');

function normalizePhoneForStorage(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

async function syncOrderFromBorzo(orderDoc) {
  if (!orderDoc?.borzoOrderId) return orderDoc;

  try {
    const borzoOrder = await fetchBorzoOrder(orderDoc.borzoOrderId);
    if (!borzoOrder) return orderDoc;

    const nextStatus = mapBorzoOrderStatusToAppStatus(borzoOrder.status);
    orderDoc.status = nextStatus;
    orderDoc.deliveryProvider = 'borzo';
    orderDoc.borzoStatus = borzoOrder.status;
    orderDoc.borzoTrackingUrl = borzoOrder.points?.[1]?.tracking_url || orderDoc.borzoTrackingUrl;
    orderDoc.borzoPickupAddress = borzoOrder.points?.[0]?.address || orderDoc.borzoPickupAddress;
    orderDoc.borzoDropAddress = borzoOrder.points?.[1]?.address || orderDoc.borzoDropAddress;
    orderDoc.borzoRaw = borzoOrder;
    orderDoc.borzoLastSyncedAt = new Date();
    await orderDoc.save();
  } catch (err) {
    orderDoc.deliveryError = `Borzo sync failed: ${err.message}`;
    await orderDoc.save();
  }

  return orderDoc;
}

// GET orders (admin/all, or customer by phone)
router.get('/', async (req, res) => {
  try {
    const { phone } = req.query;
    const normalizedPhone = normalizePhoneForStorage(phone);
    const filter = normalizedPhone ? { customerPhone: normalizedPhone } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    const synced = await Promise.all(orders.map((order) => syncOrderFromBorzo(order)));
    res.json(synced);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create order
router.post('/', async (req, res) => {
  try {
    const { customerAddress } = req.body;
    const normalizedPhone = normalizePhoneForStorage(req.body.customerPhone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Please enter a valid phone number.' });
    }
    if (!isBengaluruAddress(customerAddress)) {
      return res.status(400).json({
        error: 'Delivery is currently available only in Bengaluru.',
      });
    }

    const order = new Order(req.body);
    order.customerPhone = normalizedPhone;
    order.deliveryProvider = 'borzo';
    order.status = 'confirmed';
    order.borzoPickupAddress = process.env.BORZO_PICKUP_ADDRESS || null;
    order.borzoDropAddress = order.customerAddress || process.env.BORZO_FALLBACK_DROP_ADDRESS || null;
    await order.save();

    try {
      const borzoOrder = await createBorzoOrderForAppOrder(order);
      order.borzoOrderId = borzoOrder.order_id;
      order.borzoStatus = borzoOrder.status;
      order.borzoTrackingUrl = borzoOrder.points?.[1]?.tracking_url || null;
      order.borzoRaw = borzoOrder;
      order.borzoLastSyncedAt = new Date();
      order.status = mapBorzoOrderStatusToAppStatus(borzoOrder.status);
      await order.save();
    } catch (deliveryError) {
      order.deliveryError = `Borzo create failed: ${deliveryError.message}`;
      await order.save();
      return res.status(502).json({
        error: 'Order created locally but Borzo booking failed. Please contact support.',
        order,
      });
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH update order status (admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET order by id
router.get('/:id', async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order = await syncOrderFromBorzo(order);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
