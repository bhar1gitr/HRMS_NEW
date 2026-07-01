const express    = require("express");
const router     = express.Router();
const multer     = require("multer");
const path       = require("path");
const verifyToken = require("../middlewares/authMiddleware");
const leaveController = require("../controllers/leaveController");

// ─── File upload (doctor prescription) ───────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/leave-docs"),
  filename:    (req, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ─── Employee routes ─────────────────────────────────────────────────────────
router.get("/balance", verifyToken, leaveController.getBalance);
router.get("/my-requests", verifyToken, leaveController.getMyRequests);
router.post("/apply", verifyToken, upload.single("attachment"), leaveController.applyLeave);

// ─── Manager routes ──────────────────────────────────────────────────────────
router.get("/pending-approvals", verifyToken, leaveController.getPendingApprovals);  

// ─── HR / Admin routes ────────────────────────────────────────────────────────
router.get("/all-requests", verifyToken, leaveController.getAllRequests);            

// ─── Calendar & Holidays ──────────────────────────────────────────────────────
router.get("/calendar", verifyToken, leaveController.getLeaveCalendar);
router.get("/holiday-submissions", verifyToken, leaveController.getHolidaySubmissions);
router.post("/submit-holidays", verifyToken, leaveController.submitFlexiHolidays);

// ─── Approve / Reject ─────────────────────────────────────────────────────────
router.post("/:id/approve", verifyToken, leaveController.approveLeave);            
router.post("/:id/reject", verifyToken, leaveController.rejectLeave);             

module.exports = router;