const express = require('express');
const router = express.Router();
const multer = require('multer')
const employeeController = require('../controllers/employeeController');

const upload = multer({
  dest: "uploads/resignations/"
});

router.post(
  "/submit-resignation",
  upload.single("attachment"),
  employeeController.submitResignation
);

router.get("/active-resignation", employeeController.getActiveResignation);

router.get(
  "/all-resignations",
  employeeController.getAllResignations
);

// Advance workflow milestones (Updates status keys, adds comments, logs final LWD)
router.put(
  "/update-resignation-status",
  employeeController.updateResignationStatus
);

router.get('/timesheets', employeeController.getTimesheets);
router.post('/timesheets', employeeController.addTimesheet);
router.put('/timesheets/:id', employeeController.updateTimesheet);
router.delete('/timesheets/:id', employeeController.deleteTimesheet); 

module.exports = router;

