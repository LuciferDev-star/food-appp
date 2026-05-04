const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: String,
  price: Number,
  quantity: Number,
  image: String,
});

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentId: { type: String },
  razorpayOrderId: { type: String },
  deliveryProvider: {
    type: String,
    enum: ['none', 'borzo'],
    default: 'none',
  },
  borzoOrderId: { type: Number },
  borzoTrackingUrl: { type: String },
  borzoStatus: { type: String },
  borzoPickupAddress: { type: String },
  borzoDropAddress: { type: String },
  borzoRaw: { type: mongoose.Schema.Types.Mixed },
  borzoLastSyncedAt: { type: Date },
  deliveryError: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
