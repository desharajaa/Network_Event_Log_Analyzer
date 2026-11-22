const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  analyzeLogs,
  getLogs,
  getLogById,
  clearLogs
} = require('../controllers/logController');
const { DEFAULT_SAMPLE_LOGS, TEST_SCENARIOS } = require('../utils/sampleScenarios');

// Log analysis (accepts file upload 'file' or JSON body { logsText })
router.post('/analyze', upload.single('file'), analyzeLogs);

// Query logs with filters
router.get('/', getLogs);

// Sample logs and test scenarios
router.get('/samples', (req, res) => {
  res.status(200).json({
    success: true,
    defaultSample: DEFAULT_SAMPLE_LOGS,
    scenarios: TEST_SCENARIOS
  });
});

// Single log by ID
router.get('/:id', getLogById);

// Clear logs and alerts
router.delete('/', clearLogs);

module.exports = router;
