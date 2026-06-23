const express = require('express');
const router = express.Router();
const employeeController,submitResignation = require('../controllers/employeeController');

const upload = multer({
  dest: "uploads/resignations/"
});

router.post(
  "/submit-resignation",
  upload.single("attachment"),
  submitResignation
);


router.get('/timesheets', employeeController.getTimesheets);
router.post('/timesheets', employeeController.addTimesheet);
router.put('/timesheets/:id', employeeController.updateTimesheet);
router.delete('/timesheets/:id', employeeController.deleteTimesheet); // This is now safely resolved!

module.exports = router;

