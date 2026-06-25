const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');

// ==========================================
//          SUPERVISOR & HR ROUTES
// ==========================================

// Route to fetch timesheets filtered by Direct Supervisor or Indirect Supervisor (HR)
router.get('/timesheets', managerController.getTeamTimesheets);

// Route to update approval status (Approve / Reject) for a specific task entry step
router.put('/timesheets/review/:id', managerController.reviewTimesheetStatus);

module.exports = router;