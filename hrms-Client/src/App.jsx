import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoutes";

// auth
import Login from "./pages/Login";

// admin
import AdminDashboard from "./pages/admin/Dashboard";
import AdminEmployees from "./pages/admin/Employees";
import AdminDepartments from "./pages/admin/Departments";
import AdminLeaves from './pages/admin/Leaves'
import AdminEmployeeStatus from './pages/admin/EmployeeStatus'
import AdminAnnouncement from './pages/admin/Announcement'
import AdminClient from './pages/admin/Client'
import AdminProjects from './pages/admin/Projects'
import Candidates from "./pages/admin/Recruitment/Candidates";
import InterviewPipeline from "./pages/admin/Recruitment/InterviewPipeline";
import SelectedCandidates from "./pages/admin/Recruitment/SelectedCandidates";

// employee
import EmployeeDashboard from "./pages/employee/Dashboard";
import EmployeeDetails from "./pages/employee/Details";
import EmployeeLeaves from "./pages/employee/Leave";
import EmployeeResign from './pages/employee/Resign';
import TimeSheetMaster from "./pages/employee/TimeSheet";


// layouts
import AdminLayout from "./components/layout/AdminLayout";
import EmployeeLayout from "./components/layout/EmployeeLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={["admin", "hr"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="departments" element={<AdminDepartments />} />
          <Route path="leaves" element={<AdminLeaves />} />
          <Route path="employeestatus" element={<AdminEmployeeStatus />} />
          <Route path="announcements" element={<AdminAnnouncement />} />
          <Route path="clients" element={<AdminClient />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route
            path="/admin/Recruitment/candidates"
            element={<Candidates />}
          />
          <Route
            path="/admin/Recruitment/interviews"
            element={<InterviewPipeline />}
          />
          <Route
            path="/admin/Recruitment/selected"
            element={<SelectedCandidates />}
          />
        </Route>

        <Route 
          path="/employee" 
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="details" element={<EmployeeDetails />} />
          <Route path="leaves" element={<EmployeeLeaves />} />
          <Route path="resignation" element={<EmployeeResign />} />
          <Route path="timesheet" element={<TimeSheetMaster/>}/> 
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;