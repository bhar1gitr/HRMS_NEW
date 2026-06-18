const db = require("../config/db");
const md5 = require("md5");

exports.createCandidate = async (req, res) => {
  try {
    const {
      FirstName,
      MiddleName,
      LastName,
      Gender,
      DateOfBirth,
      MaritalStatus,
      Nationality,
      EmailId,
      AlternateEmailId,
      CountryCode1,
      MobileNo,
      CountryCode2,
      AlternateMobileNo,
      CurrentAddress,
      City,
      State,
      Country,
      AppliedDesignation,
      AppliedDepartment,
      CurrentCompany,
      CurrentDesignation,
      TotalExperience,
      CurrentCTC,
      ExpectedCTC,
      NoticePeriod,
      SourceOfHiring,
      CandidateStatus,
    } = req.body;

    const resume = req.files?.ResumeFile?.[0]?.filename || null;
    const photo = req.files?.Photo?.[0]?.filename || null;

    const sql = `
      INSERT INTO interview_candidates (
        FirstName, MiddleName, LastName, Gender, DateOfBirth, MaritalStatus, Nationality,
        EmailId, AlternateEmailId, CountryCode1, MobileNo, CountryCode2, AlternateMobileNo,
        CurrentAddress, City, State, Country, AppliedDesignation, AppliedDepartment,
        CurrentCompany, CurrentDesignation, TotalExperience, CurrentCTC, ExpectedCTC,
        NoticePeriod, SourceOfHiring, CandidateStatus, ResumeFile, Photo
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    await db.query(sql, [
      FirstName,
      MiddleName,
      LastName,
      Gender,
      DateOfBirth,
      MaritalStatus,
      Nationality,
      EmailId,
      AlternateEmailId,
      CountryCode1,
      MobileNo,
      CountryCode2,
      AlternateMobileNo,
      CurrentAddress,
      City,
      State,
      Country,
      AppliedDesignation,
      AppliedDepartment,
      CurrentCompany,
      CurrentDesignation,
      TotalExperience,
      CurrentCTC,
      ExpectedCTC,
      NoticePeriod,
      SourceOfHiring,
      CandidateStatus || "Applied", // Default state fallback
      resume,
      photo,
    ]);

    res.status(201).json({
      success: true,
      message: "Candidate created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM interview_candidates
      ORDER BY CandidateID DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCandidateById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM interview_candidates WHERE CandidateID = ?`,
      [req.params.id],
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPipelineCandidates = async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.*, 
        r.RoundID AS LatestRoundID, 
        r.RoundName AS CurrentRoundName, 
        r.RoundResult AS RoundStatus
      FROM interview_candidates c
      LEFT JOIN interview_rounds r ON r.CandidateID = c.CandidateID 
        AND r.RoundID = (
          SELECT MAX(RoundID) 
          FROM interview_rounds 
          WHERE CandidateID = c.CandidateID
        )
      WHERE c.CandidateStatus NOT IN ('Rejected', 'Selected', 'Joined')
      ORDER BY c.CandidateID DESC
    `;

    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching pipeline info:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.scheduleInterview = async (req, res) => {
  try {
    const {
      CandidateID,
      RoundName,
      InterviewDate, // Captured safely from frontend scheduleForm
      InterviewTime, // Captured safely from frontend scheduleForm
      InterviewMode,
      InterviewerName,
      InterviewerDesignation,
      Department,
      MeetingLink,
      Location,
    } = req.body;

    // Standardize your SQL DateTime structure safely
    const interviewDateTime = `${InterviewDate} ${InterviewTime}:00`;

    const [lastRound] = await db.query(
      `SELECT MAX(RoundNumber) AS RoundNumber FROM interview_rounds WHERE CandidateID = ?`,
      [CandidateID],
    );

    const nextRoundNumber = (lastRound[0]?.RoundNumber || 0) + 1;

    await db.query(
      `
      INSERT INTO interview_rounds
      (
        CandidateID, RoundNumber, RoundName, InterviewMode, InterviewDate, 
        InterviewerName, InterviewerDesignation, Department, MeetingLink, Location
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        CandidateID,
        nextRoundNumber,
        RoundName,
        InterviewMode,
        interviewDateTime,
        InterviewerName,
        InterviewerDesignation || null,
        Department || null,
        MeetingLink || null,
        Location || null,
      ],
    );

    // Update main tracking state
    await db.query(
      `UPDATE interview_candidates SET CandidateStatus = 'Interview Scheduled' WHERE CandidateID = ?`,
      [CandidateID],
    );

    res.json({ success: true, message: "Interview scheduled successfully" });
  } catch (error) {
    console.error("Error scheduling interview:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRoundOutcome = async (req, res) => {
  try {
    const {
      RoundID,
      CandidateID,
      RoundResult,
      TechnicalScore,
      CommunicationScore,
      AttitudeScore,
      DomainKnowledgeScore,
      Strengths,
      Weaknesses,
      InterviewFeedback,
      OverallScore,
    } = req.body;

    if (!RoundID || !CandidateID || !RoundResult) {
      return res
        .status(400)
        .json({ success: false, message: "Required metrics missing" });
    }

    let dbRoundResult = "Hold";
    if (RoundResult === "Pass") dbRoundResult = "Pass";
    if (RoundResult === "Fail") dbRoundResult = "Fail";

    // Update current round details
    await db.query(
      `UPDATE interview_rounds SET RoundResult = ?, TechnicalScore = ?, CommunicationScore = ?, AttitudeScore = ?, DomainKnowledgeScore = ?, Strengths = ?, Weaknesses = ?, InterviewFeedback = ?, OverallScore = ? WHERE RoundID = ?`,
      [
        dbRoundResult,
        TechnicalScore || null,
        CommunicationScore || null,
        AttitudeScore || null,
        DomainKnowledgeScore || null,
        Strengths || null,
        Weaknesses || null,
        InterviewFeedback || null,
        OverallScore || null,
        RoundID,
      ],
    );

    let candidateStatus = "Interview In Progress";

    if (dbRoundResult === "Fail") {
      candidateStatus = "Rejected";
      await db.query(
        `UPDATE interview_candidates SET CandidateStatus = ? WHERE CandidateID = ?`,
        [candidateStatus, CandidateID],
      );
    } else if (dbRoundResult === "Hold") {
      candidateStatus = "On Hold";
      await db.query(
        `UPDATE interview_candidates SET CandidateStatus = ? WHERE CandidateID = ?`,
        [candidateStatus, CandidateID],
      );
    } else if (dbRoundResult === "Pass") {
      //  Safe & Fixed Branch Optimization:
      const [currentRoundData] = await db.query(
        `SELECT RoundName FROM interview_rounds WHERE RoundID = ?`,
        [RoundID],
      );

      const completedRoundName = currentRoundData?.[0]?.RoundName;
      if (completedRoundName === "Joining" && dbRoundResult === "Pass") {
        await db.query(
          `UPDATE interview_candidates
     SET CandidateStatus = 'Selected',
         TentativeJoiningDate = DATE_ADD(CURDATE(), INTERVAL 14 DAY)
     WHERE CandidateID = ?`,
          [CandidateID],
        );

        return res.json({
          success: true,
          message: "Candidate moved to onboarding queue",
        });
      }

      const STAGES = [
        "HR Screening",
        "Technical Round 1",
        "Technical Round 2",
        "Functional Head Round",
        "Quality / Compliance Round",
        "Director / Management Round",
        "Offer Discussion",
        "Joining",
      ];

      if (completedRoundName === "Offer Discussion") {
        await db.query(
          `INSERT INTO interview_rounds
    (
      CandidateID,
      RoundNumber,
      RoundName
    )
    VALUES
    (
      ?,
      (
        SELECT COALESCE(MAX(RoundNumber),0)+1
        FROM interview_rounds r
        WHERE CandidateID = ?
      ),
      'Joining'
    )`,
          [CandidateID, CandidateID],
        );

        await db.query(
          `UPDATE interview_candidates
     SET CandidateStatus = 'Interview In Progress'
     WHERE CandidateID = ?`,
          [CandidateID],
        );
      } else {
        // Normal sequential stage iteration rules
        const currentIndex = STAGES.indexOf(completedRoundName);
        if (currentIndex !== -1 && currentIndex < STAGES.length - 1) {
          const nextRoundName = STAGES[currentIndex + 1];
          await db.query(
            `INSERT INTO interview_rounds (
  CandidateID,
  RoundNumber,
  RoundName
)
VALUES (?, ?, ?)`,
            [CandidateID, CandidateID, nextRoundName],
          );
        }
        await db.query(
          `UPDATE interview_candidates SET CandidateStatus = ? WHERE CandidateID = ?`,
          [candidateStatus, CandidateID],
        );
      }
    }

    res.json({ success: true, message: "Round processed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ENDPOINT FOR SELECTED ONBOARDING BOARD
exports.getSelectedCandidates = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT CandidateID, FirstName, LastName, AppliedDesignation, DATE_FORMAT(TentativeJoiningDate, '%d %b %Y') AS JoiningDate 
       FROM interview_candidates 
       WHERE CandidateStatus = 'Selected' ORDER BY TentativeJoiningDate ASC`,
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.convertToEmployee = async (req, res) => {
  try {
    const { CandidateID } = req.body;

    const [candidateRows] = await db.query(
      `SELECT * FROM interview_candidates WHERE CandidateID = ?`,
      [CandidateID]
    );

    if (!candidateRows.length) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    const c = candidateRows[0];

    // Prevent duplicate employee creation
    const [existing] = await db.query(
      `SELECT EmployeeID FROM employee WHERE EmailId = ?`,
      [c.EmailId]
    );

    if (existing.length) {
      return res.status(400).json({
        success: false,
        message: "Employee already exists"
      });
    }

    const today = new Date().toISOString().split("T")[0];

    await db.query(
      `
      INSERT INTO employee (
        FirstName,
        MiddleName,
        LastName,
        DirectSupervisor,
        IndirectSupervisor,
        CurrentAddress,
        PermanantAddress,
        EmailId,
        Password,
        CountryCode1,
        CurrentContactNo,
        CountryCode2,
        AlternateContactNo,
        CountryCode3,
        EmergencyContactNo,
        MaritalStatus,
        Gender,
        DateOfBirth,
        Nationality,
        BloodGroup,
        NomineeName,
        NomineeRelation,
        Photo,
        AccountHolderName,
        AccountNumber,
        BankName,
        IFSCCode,
        NEFT,
        Branch,
        PANNo,
        DrivingLicense,
        ExpiryDrivingLicense,
        PassportNo,
        StartDate,
        EndDate,
        PassportLocation,
        Designation,
        DesignationStartDate,
        DesignationEndDate,
        Department,
        CompanyBranch,
        WorkingBranch,
        WorkLocation,
        CreatedDate,
        CreatedBy,
        ModifiedBy,
        Status,
        StatusOfEmployee,
        role,
        ArchiveStatus,
        AlternateEmailId
      )
      VALUES (
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      )
      `,
      [
        c.FirstName,
        c.MiddleName || "",
        c.LastName,

        "", // DirectSupervisor
        "", // IndirectSupervisor

        c.CurrentAddress || "",
        c.CurrentAddress || "",

        c.EmailId,
        md5("123456"), // Default Password

        c.CountryCode1 || "+91",
        c.MobileNo || "",

        c.CountryCode2 || "",
        c.AlternateMobileNo || "",

        "", // CountryCode3
        "", // EmergencyContactNo

        c.MaritalStatus || "",
        c.Gender || "",
        c.DateOfBirth || "",
        c.Nationality || "",

        "", // BloodGroup
        "", // NomineeName
        "", // NomineeRelation

        c.Photo || null,

        "", // AccountHolderName
        "", // AccountNumber
        "", // BankName
        "", // IFSCCode
        "", // NEFT
        "", // Branch

        "", // PANNo
        "", // DrivingLicense
        "", // ExpiryDrivingLicense
        "", // PassportNo

        today, // StartDate
        "",

        "", // PassportLocation

        c.AppliedDesignation || null,
        today,
        "",

        c.AppliedDepartment || null,

        null, // CompanyBranch
        0,    // WorkingBranch

        "", // WorkLocation

        today,
        "HR",
        "HR",

        "Active",
        "Working",

        "employee",

        "0", // ✅ ArchiveStatus (VISIBLE)

        c.AlternateEmailId || ""
      ]
    );

    await db.query(
      `
      UPDATE interview_candidates
      SET CandidateStatus = 'Joined'
      WHERE CandidateID = ?
      `,
      [CandidateID]
    );

    res.json({
      success: true,
      message: "Candidate converted successfully"
    });

  } catch (error) {
    console.error("Convert Employee Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
