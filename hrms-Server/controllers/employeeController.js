const db = require('../config/db');

const cleanBigInt = (val) => {
    return (!val || val === "" || isNaN(val)) ? 0 : parseInt(val);
};

// 1. FETCH LOGGED-IN EMPLOYEE TIMESHEETS
exports.getTimesheets = async (req, res) => {
    try {
        const { employeeId } = req.query;
        if (!employeeId) {
            return res.status(400).json({ message: "Authentication context mismatch. Missing employee id." });
        }

        const query = `
            SELECT * FROM pms_timesheet 
            WHERE employeeid = ? 
            ORDER BY timesheetdate DESC, timesheetid DESC
        `;
        const [rows] = await db.query(query, [employeeId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching timesheets:", error);
        res.status(500).json({ message: "Failed to fetch timesheet records", error: error.message });
    }
};

// 2. ADD NEW STEP LOG TASK (FIXED)
exports.addTimesheet = async (req, res) => {
    try {
        const tsData = { ...req.body };
        
        tsData.status = 0; // Default: Pending Review

        // Inject fallback placeholders for approval parameters to satisfy NOT NULL table rules
        tsData.approvedById = 0;
        tsData.approveDate = '1970-01-01 00:00:00'; 

        // FIXED: Explicitly delete UI state keys so they don't break dynamic INSERT queries
        delete tsData.timesheetid;
        delete tsData.billingType;
        delete tsData.studyid; 

        // Sanitize IDs
        tsData.projectid = cleanBigInt(tsData.projectid);
        tsData.taskid = cleanBigInt(tsData.taskid);
        tsData.activitytypeid = cleanBigInt(tsData.activitytypeid);
        tsData.nonprojectactivityid = cleanBigInt(tsData.nonprojectactivityid);
        tsData.pmscontractid = cleanBigInt(tsData.pmscontractid);
        tsData.departmentid = cleanBigInt(tsData.departmentid);
        tsData.roleid = cleanBigInt(tsData.roleid);
        tsData.unitid = cleanBigInt(tsData.unitid);

        // String formatting
        tsData.tothrs = tsData.tothrs ? String(tsData.tothrs) : "0";
        tsData.totmin = tsData.totmin ? String(tsData.totmin) : "0";
        tsData.unitcnt = tsData.unitcnt ? String(tsData.unitcnt) : "0";

        const columns = Object.keys(tsData);
        const values = Object.values(tsData);
        const placeholders = columns.map(() => '?').join(', ');

        const query = `INSERT INTO pms_timesheet (${columns.join(', ')}) VALUES (${placeholders})`;
        const [result] = await db.query(query, values);

        res.status(201).json({ message: "Task logged successfully", id: result.insertId });
    } catch (error) {
        console.error("Error adding timesheet entry:", error);
        res.status(500).json({ message: "Failed to save entry log", error: error.message });
    }
};

// 3. EDIT PENDING LOG TASK (FIXED)
exports.updateTimesheet = async (req, res) => {
    try {
        const { id } = req.params;
        const tsData = { ...req.body };

        const [existing] = await db.query('SELECT status FROM pms_timesheet WHERE timesheetid = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: "Timesheet log not found" });
        
        if (existing[0].status === 1) {
            return res.status(403).json({ message: "This entry is already locked and cannot be altered." });
        }

        // 1. Strip UI-specific state fields
        delete tsData.timesheetid;
        delete tsData.createDate;
        delete tsData.updateDate;
        delete tsData.FirstName;
        delete tsData.LastName;
        delete tsData.billingType; 
        delete tsData.studyid; 

        // 2. FIXED: Strip Manager metadata (Fixes the DATETIME crash)
        delete tsData.approveDate;
        delete tsData.approvedById;
        delete tsData.rejection_comment;

        // Reset status to 0 (Pending) so the manager can review the corrections
        tsData.status = 0; 

        tsData.projectid = cleanBigInt(tsData.projectid);
        tsData.taskid = cleanBigInt(tsData.taskid);
        tsData.activitytypeid = cleanBigInt(tsData.activitytypeid);
        tsData.nonprojectactivityid = cleanBigInt(tsData.nonprojectactivityid);
        tsData.pmscontractid = cleanBigInt(tsData.pmscontractid);
        tsData.departmentid = cleanBigInt(tsData.departmentid);
        tsData.roleid = cleanBigInt(tsData.roleid);
        tsData.unitid = cleanBigInt(tsData.unitid);

        tsData.tothrs = tsData.tothrs ? String(tsData.tothrs) : "0";
        tsData.totmin = tsData.totmin ? String(tsData.totmin) : "0";
        tsData.unitcnt = tsData.unitcnt ? String(tsData.unitcnt) : "0";

        const columns = Object.keys(tsData);
        const values = Object.values(tsData);
        const setClause = columns.map(col => `${col} = ?`).join(', ');
        
        const query = `UPDATE pms_timesheet SET ${setClause} WHERE timesheetid = ?`;
        values.push(id);

        await db.query(query, values);
        res.status(200).json({ message: "Timesheet entry updated successfully" });
    } catch (error) {
        console.error("Error updating timesheet log entry:", error);
        res.status(500).json({ message: "Failed to save entry adjustments", error: error.message });
    }
};

// 4. DELETE CONTROLLER
exports.deleteTimesheet = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query('SELECT status FROM pms_timesheet WHERE timesheetid = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: "Timesheet log not found" });
        if (existing[0].status === 1) {
            return res.status(403).json({ message: "Cannot delete an approved or locked timesheet record." });
        }

        await db.query('DELETE FROM pms_timesheet WHERE timesheetid = ?', [id]);
        res.status(200).json({ message: "Timesheet step purged successfully." });
    } catch (error) {
        console.error("Error deleting timesheet:", error);
        res.status(500).json({ message: "Failed to delete timesheet", error: error.message });
    }
};

// 5. RESIGNATION WORKFLOWS
exports.submitResignation = async (req, res) => {
  try {
    console.log("Inspecting incoming request data context:");
    console.log("req.user:", req.user);
    console.log("req.body:", req.body);

    // FIXED: Safe extraction matrix to fall back to the frontend's injected employeeId field
    let employeeId = null;
    
    if (req.user && req.user.id) {
      employeeId = req.user.id;
    } else if (req.user && req.user.EmployeeID) {
      employeeId = req.user.EmployeeID;
    } else if (req.body && (req.body.employeeId || req.body.EmployeeID)) {
      employeeId = req.body.employeeId || req.body.EmployeeID;
    }

    // Guard clause: If both req.user and req.body fall through, return a clean error instead of crashing node
    if (!employeeId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authorization state context mismatch. Missing employee session identifier." 
      });
    }

    const { resignationDate, primaryReason, additionalComments } = req.body;
    const noticePeriodDays = 90;

    const lwd = new Date(resignationDate);
    lwd.setDate(lwd.getDate() + noticePeriodDays);

    const attachmentPath = req.file ? `/uploads/resignations/${req.file.filename}` : null;

    const [result] = await db.query(
      `INSERT INTO employee_resignations (EmployeeID, ResignationDate, PrimaryReason, AdditionalComments, NoticePeriodDays, SystemLastWorkingDate, AttachmentPath, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employeeId, resignationDate, primaryReason, additionalComments || null, noticePeriodDays, lwd, attachmentPath, "Submitted"]
    );

    res.status(201).json({ success: true, message: "Resignation submitted successfully", resignationId: result.insertId });
  } catch (error) {
    console.error("Error writing resignation node block:", error);
    res.status(500).json({ success: false, message: "Failed to submit resignation", error: error.message });
  }
};

exports.getActiveResignation = async (req, res) => {
  try {
    console.log("Checking getActiveResignation query context params:", req.query);

    let employeeId = null;
    
    if (req.user && req.user.id) {
      employeeId = req.user.id;
    } else if (req.user && req.user.EmployeeID) {
      employeeId = req.user.EmployeeID;
    } else if (req.query && (req.query.employeeId || req.query.EmployeeID)) {
      employeeId = req.query.employeeId || req.query.EmployeeID;
    }

    if (!employeeId) {
      return res.status(200).json({ 
        success: false, 
        hasActiveResignation: false, 
        message: "Awaiting valid structural user session token or query identifier parameters." 
      });
    }

    // FIXED: Changed ORDER BY id DESC to ORDER BY ResignationDate DESC
    const query = `
      SELECT * FROM employee_resignations
      WHERE EmployeeID = ? 
      ORDER BY ResignationDate DESC LIMIT 1
    `;
    const [rows] = await db.query(query, [employeeId]);

    if (rows.length === 0) {
      return res.status(200).json({ success: true, hasActiveResignation: false });
    }

    res.status(200).json({ success: true, hasActiveResignation: true, data: rows[0] });
  } catch (error) {
    console.error("Error retrieving separation context state:", error);
    res.status(500).json({ success: false, message: "Failed to read resignation logs", error: error.message });
  }
};

// FETCH ALL RESIGNATIONS (For HR Oversight or Manager Hierarchy)
exports.getAllResignations = async (req, res) => {
  try {
    const { role, supervisorId } = req.query;
    let query = "";
    let queryParams = [];

    // HR and Admin see everything company-wide
    if (role === 'hr' || role === 'admin') {
      query = `
        SELECT r.*, e.FirstName, e.LastName, d.Department as DepartmentName 
        FROM employee_resignations r
        JOIN employee e ON r.EmployeeID = e.EmployeeID
        LEFT JOIN department d ON e.department = d.id
        ORDER BY r.ResignationDate DESC
      `;
    } else {
      // Managers see only their direct/indirect reports
      query = `
        SELECT r.*, e.FirstName, e.LastName, d.Department as DepartmentName 
        FROM employee_resignations r
        JOIN employee e ON r.EmployeeID = e.EmployeeID
        LEFT JOIN department d ON e.department = d.id
        WHERE e.DirectSupervisor = ? OR e.IndirectSupervisor = ?
        ORDER BY r.ResignationDate DESC
      `;
      queryParams = [supervisorId, supervisorId];
    }

    const [rows] = await db.query(query, queryParams);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Error pulling exit records:", error);
    res.status(500).json({ success: false, message: "Failed to load resignation requests" });
  }
};

// UPDATE RESIGNATION STATE STATUS MATRIX
exports.updateResignationStatus = async (req, res) => {
  try {
    const { resignationId, nextStatus, managerComments, confirmedLWD } = req.body;

    if (!resignationId || !nextStatus) {
      return res.status(400).json({ success: false, message: "Missing processing updates parameters." });
    }

    // Dynamic field building depending on which portal submits
    let updateFields = "`Status` = ?";
    let queryParams = [nextStatus];

    if (managerComments) {
      updateFields += ", `AdditionalComments` = CONCAT(IFNULL(AdditionalComments,''), '\nFeedback: ', ?)";
      queryParams.push(managerComments);
    }

    if (confirmedLWD) {
      updateFields += ", `SystemLastWorkingDate` = ?";
      queryParams.push(new Date(confirmedLWD));
    }

    queryParams.push(resignationId);

    await db.query(`UPDATE employee_resignations SET ${updateFields} WHERE id = ?`, queryParams);

    res.status(200).json({ success: true, message: `Resignation state advanced to ${nextStatus}` });
  } catch (error) {
    console.error("Error transitioning separation status node:", error);
    res.status(500).json({ success: false, message: "Failed to process resignation step update." });
  }
};