const db = require("../config/db");

exports.applyLeave = async (req, res) => {
  try {

    const employeeId = req.user.id;

    const {
      leaveType,
      halfDay,
      fromDate,
      toDate,
      reason,
      flexiSelected,
      emergencyContact,
      contactNumber,
      handoverTo
    } = req.body;

    const attachment = req.file
      ? req.file.filename
      : null;

    const start = new Date(fromDate);
    const end = new Date(toDate);

    const days =
      Math.floor(
        (end - start) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    let status =
      days <= 3
        ? "Pending"
        : "Forwarded to HR";

    await db.query(
      `
      INSERT INTO leave_requests
      (
        EmployeeID,
        LeaveType,
        HalfDay,
        FromDate,
        ToDate,
        Days,
        Reason,
        Attachment,
        FlexiHoliday,
        EmergencyContact,
        ContactNumber,
        Status
      )
      VALUES
      (?,?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        employeeId,
        leaveType,
        halfDay,
        fromDate,
        toDate,
        days,
        reason,
        attachment,
        flexiSelected,
        emergencyContact,
        contactNumber,
        status
      ]
    );

    res.json({
      success: true,
      message: "Leave applied successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

exports.getMyRequests = async (req, res) => {
  try {

    const employeeId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT *
      FROM leave_requests
      WHERE EmployeeID = ?
      ORDER BY LeaveID DESC
      `,
      [employeeId]
    );

    res.json(rows);

  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getPendingApprovals = async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT
      lr.*,
      e.EmployeeName AS employeeName
      FROM leave_requests lr
      JOIN employee e
      ON e.EmployeeID = lr.EmployeeID
      WHERE lr.Status IN
      ('Pending','Forwarded to HR')
      ORDER BY lr.LeaveID DESC
    `);

    res.json(rows);

  } catch (err) {
    res.status(500).json(err);
  }
};

exports.approveLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT *
      FROM leave_requests
      WHERE LeaveID = ?
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    const leave = rows[0];

    if (leave.Status === "Approved") {
      return res.json({
        success: true,
        message: "Already approved",
      });
    }

    await db.query(
      `
      UPDATE leave_requests
      SET
      Status = 'Approved',
      ManagerApproved = 1
      WHERE LeaveID = ?
      `,
      [id]
    );

    const fromDate = new Date(leave.FromDate);

    const month = String(fromDate.getMonth() + 1);
    const year = String(fromDate.getFullYear());

    await db.query(
      `
      INSERT INTO availed_leaves
      (
        EmployeeId,
        Month,
        Year,
        LeaveType,
        availed_leaves
      )
      VALUES (?,?,?,?,?)
      `,
      [
        leave.EmployeeID,
        month,
        year,
        leave.LeaveType,
        leave.Days,
      ]
    );

    res.json({
      success: true,
      message: "Leave approved successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

exports.rejectLeave = async (req, res) => {

  try {

    const { id } = req.params;

    await db.query(
      `
      UPDATE leave_requests
      SET Status='Rejected'
      WHERE LeaveID=?
      `,
      [id]
    );

    res.json({
      success: true
    });

  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getBalance = async (req, res) => {
    
  try {console.log("REQ USER =", req.user);

    const employeeId = req.user.id;
    const year = new Date().getFullYear();

    const [employeeRows] = await db.query(
      `
      SELECT Gender
      FROM employee
      WHERE EmployeeID = ?
      `,
      [employeeId]
    );

    const gender =
      employeeRows.length > 0
        ? employeeRows[0].Gender
        : "Male";

    const [balanceRows] = await db.query(
      `
      SELECT *
      FROM leave_balance
      WHERE EmployeeId = ?
      AND Year = ?
      `,
      [employeeId, year]
    );

    if (!balanceRows.length) {
      await db.query(
        `
        INSERT INTO leave_balance
        (
          EmployeeId,
          Year,
          CasualLeave,
          SickLeave,
          EarnedLeave,
          FlexiHoliday,
          MaternityLeave
        )
        VALUES (?,?,?,?,?,?,?)
        `,
        [
          employeeId,
          year,
          7,
          7,
          0,
          2,
          180,
        ]
      );

      return res.json({
  Casual: 7,
  Sick: 7,
  Earned: 0,
  Flexi: 2,
  ...(gender?.toLowerCase() === "female" && {
    Maternity: 180,
  }),
});
    }

    const balance = balanceRows[0];

    const [usedRows] = await db.query(
      `
      SELECT
      LeaveType,
      SUM(availed_leaves) AS used
      FROM availed_leaves
      WHERE EmployeeId = ?
      GROUP BY LeaveType
      `,
      [employeeId]
    );

    const used = {};

usedRows.forEach((row) => {
  used[row.LeaveType] = Number(row.used || 0);
});

res.json({
  Casual:
    Number(balance.CasualLeave) -
    (used.Casual || 0),

  Sick:
    Number(balance.SickLeave) -
    (used.Sick || 0),

  Earned:
    Number(balance.EarnedLeave) -
    (used.Earned || 0),

  Flexi:
    Number(balance.FlexiHoliday) -
    (used.Flexi || 0),

  ...(gender?.toLowerCase() === "female" && {
    Maternity:
      Number(balance.MaternityLeave) -
      (used.Maternity || 0),
  }),
});

} catch (err) {
  console.error(err);
  res.status(500).json(err);
}
};

