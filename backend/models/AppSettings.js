const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
  appName: { type: String, default: 'FoodApp' },
  logoUrl: { type: String, default: '' },
  accentColor: { type: String, default: '#FF6B35' },
}, { timestamps: true });

module.exports = mongoose.model('AppSettings', appSettingsSchema);
