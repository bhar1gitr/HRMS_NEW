const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const AuthModel = require("../models/authModel");
const md5 = require("md5");

exports.login = async (req, res) => {
  try {
    // 1. We no longer need loginType from the frontend
    const { identifier, password } = req.body;

    const employee = await AuthModel.findEmployee(identifier);

    if (!employee) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    
    const hashedPassword = md5(password);

    if (employee.Password !== hashedPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // 2. We extract their true role directly from your database
    const role = (employee.role || "employee").toLowerCase();

    // 3. Issue the token based on their true role
    const token = jwt.sign(
      { id: employee.EmployeeID, role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4. Send the role back to the frontend so it knows where to route them
    res.json({
      success: true,
      token,
      user: {
        id: employee.EmployeeID,
        name: `${employee.FirstName} ${employee.LastName}`,
        email: employee.EmailId,
        role: role, 
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};