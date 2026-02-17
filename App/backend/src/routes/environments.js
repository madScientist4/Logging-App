const express = require('express');
const { getCachedStatus } = require('../services/environmentMonitor');

const router = express.Router();

/**
 * GET /api/environments/status
 * Retrieve current cached environment status
 */
router.get('/environments/status', (req, res) => {
  try {
    const environments = getCachedStatus();
    
    res.json({
      environments
    });
  } catch (error) {
    console.error('Error retrieving environment status:', error);
    res.status(500).json({
      error: 'Failed to retrieve environment status',
      message: error.message
    });
  }
});

module.exports = router;
