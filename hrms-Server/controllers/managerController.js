const db = require('../config/db');

// 1. FETCH TEAM TIMESHEETS FOR DIRECT OR INDIRECT SUPERVISORS
exports.getTeamTimesheets = async (req, res) => {
    try {
        const { supervisorId } = req.query; // This is the logged-in supervisor's EmployeeID (e.g., 1046)

        if (!supervisorId) {
            return res.status(400).json({ message: "Missing supervisor authentication parameter context." });
        }

        // 1. First, get the supervisor's full name from the database because 
        // DirectSupervisor/IndirectSupervisor columns store varchar names!
        const [supRows] = await db.query(
            `SELECT CONCAT(FirstName, ' ', LastName) AS FullName FROM employee WHERE EmployeeID = ?`, 
            [supervisorId]
        );

        if (supRows.length === 0) {
            return res.status(404).json({ message: "Supervisor profile not found." });
        }

        const supervisorName = supRows[0].FullName;

        // 2. Query timesheets matching against the supervisor's NAME string or their numeric ID fallback
        let query = `
            SELECT 
                t.*, 
                e.FirstName, e.LastName,
                e.DirectSupervisor, e.IndirectSupervisor,
                d.Department as DepartmentName
            FROM pms_timesheet t
            LEFT JOIN employee e ON t.employeeid = e.EmployeeID
            LEFT JOIN department d ON t.departmentid = d.id
            WHERE e.DirectSupervisor = ? 
               OR e.IndirectSupervisor = ?
               OR e.DirectSupervisor = ? -- Fallback if IDs are stored as text strings
               OR e.IndirectSupervisor = ?
               OR ? = 1 -- Global admin bypass
            ORDER BY t.timesheetdate DESC, t.employeeid ASC, t.timesheetid ASC
        `;
        
        const [rows] = await db.query(query, [
            supervisorName,   // Match text name (e.g., "Ramakant Yadav")
            supervisorName, 
            supervisorId,     // Match raw ID just in case it's a numeric string
            supervisorId,
            supervisorId
        ]);

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching supervisor team timesheets:", error);
        res.status(500).json({ message: "Failed to load timesheets directory.", error: error.message });
    }
};

// 2. APPROVE OR REJECT A TIMESHEET LOG ENTRY
exports.reviewTimesheetStatus = async (req, res) => {
    try {
        const { id } = req.params; // timesheetid
        // Accept rejection_comment from the body payload
        const { status, supervisorId, rejection_comment } = req.body; 

        if (status === undefined || !supervisorId) {
            return res.status(400).json({ message: "Missing mandatory review action parameters." });
        }

        const currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const commentValue = status === 2 ? (rejection_comment || '') : null;

        const query = `
            UPDATE pms_timesheet 
            SET status = ?, approvedById = ?, approveDate = ?, rejection_comment = ? 
            WHERE timesheetid = ?
        `;
        
        await db.query(query, [status, supervisorId, currentTimestamp, commentValue, id]);
        res.status(200).json({ message: `Timesheet state updated successfully.` });
    } catch (error) {
        console.error("Error executing review state transformation:", error);
        res.status(500).json({ message: "Failed updating verification parameters.", error: error.message });
    }
};