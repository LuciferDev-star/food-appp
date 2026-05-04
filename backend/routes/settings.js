const express = require('express');
const router = express.Router();
const AppSettings = require('../models/AppSettings');

async function getOrCreateSettings() {
  let settings = await AppSettings.findOne();
  if (!settings) {
    settings = await AppSettings.create({});
  }
  return settings;
}

router.get('/', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const updates = {
      appName: req.body.appName,
      logoUrl: req.body.logoUrl,
      accentColor: req.body.accentColor,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    Object.assign(settings, updates);
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
