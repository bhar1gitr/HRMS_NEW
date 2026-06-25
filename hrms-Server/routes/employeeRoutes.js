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


router.get('/timesheets', employeeController.getTimesheets);
router.post('/timesheets', employeeController.addTimesheet);
router.put('/timesheets/:id', employeeController.updateTimesheet);
router.delete('/timesheets/:id', employeeController.deleteTimesheet); 

module.exports = router;

