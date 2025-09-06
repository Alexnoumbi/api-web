const express = require('express');
const { query, validationResult } = require('express-validator');
const AuditLog = require('../models/AuditLog');
const { proteger, autoriser } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Obtenir le tableau de bord d'administration
// @access  Private (Admin)
router.get('/dashboard', proteger, autoriser('ADMIN'), async (req, res) => {
  try {
    // Get admin dashboard statistics
    const stats = {
      users: 0, // TODO: Implement actual statistics
      visits: 0,
      documents: 0
    };
    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/admin/activity
// @desc    Obtenir les statistiques d'activité
// @access  Private (Admin)
router.get('/activity', proteger, autoriser('ADMIN'), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ date: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
