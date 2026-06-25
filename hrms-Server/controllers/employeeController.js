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
    const employeeId = req.user.id;
    const { resignationDate, primaryReason, additionalComments } = req.body;
    const noticePeriodDays = 90;

    const lwd = new Date(resignationDate);
    lwd.setDate(lwd.getDate() + noticePeriodDays);

    const attachmentPath = req.file ? `/uploads/resignations/${req.file.filename}` : null;

    const [result] = await db.query(
      `INSERT INTO employee_resignation (EmployeeID, ResignationDate, PrimaryReason, AdditionalComments, NoticePeriodDays, SystemLastWorkingDate, AttachmentPath, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employeeId, resignationDate, primaryReason, additionalComments || null, noticePeriodDays, lwd, attachmentPath, "Submitted"]
    );

    res.status(201).json({ success: true, message: "Resignation submitted successfully", resignationId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to submit resignation" });
  }
};