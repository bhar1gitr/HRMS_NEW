const db = require("../config/db");

exports.findEmployee = async (identifier) => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM employee
    WHERE EmailId = ? OR EmployeeID = ?
    LIMIT 1
    `,
    [identifier, identifier]
  );

  return rows[0];
};