const express = require("express");
const router = express.Router();

const leaveController = require("../controllers/leaveController");

// ADD THIS
const verifyToken = require("../middlewares/authMiddleware");

router.get(
  "/balance",
  verifyToken,
  leaveController.getBalance
);

router.get(
  "/my-requests",
  verifyToken,
  leaveController.getMyRequests
);

router.post(
  "/apply",
  verifyToken,
  leaveController.applyLeave
);

router.get(
  "/pending-approvals",
  leaveController.getPendingApprovals
);


router.post(
  "/:id/approve",
  leaveController.approveLeave
);

router.post(
  "/:id/reject",
  leaveController.rejectLeave
);

module.exports = router;