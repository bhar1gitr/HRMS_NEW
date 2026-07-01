import React, { useState, useEffect } from 'react';
import { C, SHADOW, RADIUS, TYPOGRAPHY } from '../../theme';

// --- Reusable Input Component for the Form ---
const FormGroup = ({ label, name, type = "text", value, onChange, required = false, placeholder = "" }) => (
  <div style={styles.formGroup}>
    <label style={styles.label}>{label} {required && <span style={{color: 'red'}}>*</span>}</label>
    <input 
      type={type} 
      name={name} 
      value={value} 
      onChange={onChange} 
      required={required}
      placeholder={placeholder}
      style={styles.input} 
    />
  </div>
);

const Employees = () => {
  // --- Table & Data States ---
  const [employees, setEmployees] = useState([]);
  const [employeeStatuses, setEmployeeStatuses] = useState([]); 
  const [supervisors, setSupervisors] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Role Tracking State ---
  const [userRole, setUserRole] = useState("");

  // --- Modal & Form State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false); 
  const [editEmployeeId, setEditEmployeeId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); 
  
  const [activeTab, setActiveTab] = useState('Personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const initialFormState = {
    FirstName: '', MiddleName: '', LastName: '', DateOfBirth: '', Gender: '', BloodGroup: '', MaritalStatus: '', Nationality: '', NomineeName: '', NomineeRelation: '',
    EmailId: '', AlternateEmailId: '', CurrentContactNo: '', CountryCode1: '', AlternateContactNo: '', CountryCode2: '', EmergencyContactNo: '', CountryCode3: '', CurrentAddress: '', PermanantAddress: '',
    role: '', Status: 'Active', StatusOfEmployee: '', Password: '', Department: '', Designation: '', DesignationStartDate: '', DesignationEndDate: '', StartDate: '', EndDate: '', CompanyBranch: '', WorkingBranch: '', WorkLocation: '', DirectSupervisor: '', IndirectSupervisor: '',
    AccountHolderName: '', BankName: '', AccountNumber: '', IFSCCode: '', NEFT: '', Branch: '', PANNo: '', AadharNo: '', PFNo: '', PFUANNo: '', ESICNo: '', DrivingLicense: '', ExpiryDrivingLicense: '', PassportNo: '', PassportLocation: '', 
    Photo: '' 
  };

  const [formData, setFormData] = useState(initialFormState);

  // --- Data Fetching & Role Verification ---
  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/employees');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeeStatuses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/employee-statuses');
      if (response.ok) {
        const data = await response.json();
        setEmployeeStatuses(data);
      }
    } catch (err) {
      console.error("Failed to fetch employee statuses", err);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/supervisors');
      if (response.ok) {
        const data = await response.json();
        setSupervisors(data);
      }
    } catch (err) {
      console.error("Failed to fetch supervisors", err);
    }
  };

  useEffect(() => {
    const savedRole = localStorage.getItem("role") || sessionStorage.getItem("role") || "";
    setUserRole(savedRole.toUpperCase());

    fetchEmployees();
    fetchEmployeeStatuses();
    fetchSupervisors(); 
  }, []);

  const openModal = () => {
    setFormData(initialFormState);
    setSelectedFile(null); 
    setIsEditMode(false);
    setIsViewMode(false);
    setEditEmployeeId(null);
    setActiveTab('Personal');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleView = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/employees/${id}`);
      if (!response.ok) throw new Error('Failed to fetch employee details');
      
      const data = await response.json();
      const formattedData = formatEmployeeData(data);

      setFormData(formattedData);
      setSelectedFile(null); 
      setIsViewMode(true);  
      setIsEditMode(false); 
      setEditEmployeeId(id);
      setActiveTab('Personal');
      setFormError(null);
      setIsModalOpen(true);
    } catch (err) {
      alert("Error loading employee data: " + err.message);
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/employees/${id}`);
      if (!response.ok) throw new Error('Failed to fetch employee details');
      
      const data = await response.json();
      const formattedData = formatEmployeeData(data);

      setFormData(formattedData);
      setSelectedFile(null); 
      setIsEditMode(true);
      setIsViewMode(false); 
      setEditEmployeeId(id);
      setActiveTab('Personal');
      setFormError(null);
      setIsModalOpen(true);
    } catch (err) {
      alert("Error loading employee data: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee? They will be archived from the main view.")) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/employees/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete employee');
        fetchEmployees(); 
      } catch (err) {
        alert("Error deleting employee: " + err.message);
      }
    }
  };

  const formatEmployeeData = (data) => {
    const formattedData = { ...initialFormState, ...data };
    const dateFields = ['DateOfBirth', 'DesignationStartDate', 'DesignationEndDate', 'StartDate', 'EndDate', 'ExpiryDrivingLicense'];
    
    dateFields.forEach(field => {
      const dateVal = formattedData[field];
      if (dateVal) {
        try {
          if (/^\d{2}-\d{2}-\d{4}$/.test(dateVal)) {
            const [day, month, year] = dateVal.split('-');
            formattedData[field] = `${year}-${month}-${day}`; 
          } else {
            const d = new Date(dateVal);
            if (!isNaN(d.getTime())) {
              formattedData[field] = d.toISOString().split('T')[0];
            } else {
              formattedData[field] = ''; 
            }
          }
        } catch (err) {
          formattedData[field] = ''; 
        }
      } else {
        formattedData[field] = '';
      }
    });

    Object.keys(formattedData).forEach(key => {
      if (formattedData[key] === null) formattedData[key] = '';
    });
    
    return formattedData;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        submitData.append(key, formData[key]);
      }
    });

    if (selectedFile) {
      submitData.append('Photo', selectedFile);
    }

    const url = isEditMode 
        ? `http://localhost:5000/api/admin/employees/${editEmployeeId}` 
        : 'http://localhost:5000/api/admin/employees';
        
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        body: submitData,
      });

      if (!response.ok) throw new Error(`Failed to ${isEditMode ? 'update' : 'save'} employee data.`);

      alert(`Employee ${isEditMode ? 'updated' : 'added'} successfully!`);
      closeModal();
      fetchEmployees(); 
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = ['Personal', 'Contact', 'Job Details', 'Financial & ID'];

  if (isLoading && employees.length === 0) return <div style={{ color: C.text }}>Loading employees...</div>;
  if (error) return <div style={{ color: C.danger }}>Error: {error}</div>;

  return (
    <div style={{ fontFamily: TYPOGRAPHY.fontFamily, position: 'relative' }}>
      
      {/* HEADER WITH UNIVERSAL ACTION CALL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: C.secondary }}>Employees</h2>
        <button onClick={openModal} style={styles.addBtn}>+ Add Employee</button>
      </div>
      
      {/* TABLE DATA SHEET BOARD */}
      <div style={styles.tableContainer}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ borderBottom: `2px solid ${C.borderLight}` }}>
            <tr>
              <th style={styles.th}>Photo</th>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.EmployeeID} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                <td style={styles.td}>
                  {employee.Photo ? (
                    <img 
                      src={`http://localhost:5000/uploads/${employee.Photo}`} 
                      alt="Profile" 
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: C.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: C.muted }}>
                      {employee.FirstName?.[0] || 'U'}
                    </div>
                  )}
                </td>
                <td style={styles.td}>{employee.EmployeeID}</td>
                <td style={styles.td}>
                  <strong style={{ color: C.secondary }}>{employee.FirstName} {employee.LastName}</strong>
                </td>
                <td style={styles.td}>{employee.EmailId}</td>
                <td style={styles.td}>
                  <span style={styles.roleBadge}>{employee.role}</span>
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: employee.Status === 'Active' ? C.successBg : C.dangerBg,
                    color: employee.Status === 'Active' ? C.success : C.danger
                  }}>
                    {employee.Status}
                  </span>
                </td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  <button onClick={() => handleView(employee.EmployeeID)} style={styles.actionBtn.view}>View</button>
                  <button onClick={() => handleEdit(employee.EmployeeID)} style={styles.actionBtn.edit}>Edit</button>
                  <button onClick={() => handleDelete(employee.EmployeeID)} style={styles.actionBtn.archive}>Archive</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {employees.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: C.muted }}>
            No employees found.
          </div>
        )}
      </div>

      {/* DETAILED CONTROL MODAL LAYOUT OVERLAY */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: C.secondary }}>
                {isViewMode ? 'Employee Details' : (isEditMode ? 'Edit Employee' : 'Add New Employee')}
              </h2>
              <button onClick={closeModal} style={styles.closeModalBtn}>&times;</button>
            </div>

            {formError && <div style={{ color: C.danger, marginBottom: '16px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '8px' }}>{formError}</div>}

            <div style={styles.tabContainer}>
              {tabs.map(tab => (
                <button 
                  key={tab} 
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={activeTab === tab ? styles.activeTab : styles.inactiveTab}
                >
                  {tab}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.scrollableFormArea}>
                <fieldset disabled={isViewMode} style={{ border: 'none', padding: 0, margin: 0 }}>
                  
                  {/* TAB 1: Personal Details */}
                  {activeTab === 'Personal' && (
                    <div style={styles.grid}>
                      
                      <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                        <label style={styles.label}>Profile Photo</label>
                        {isViewMode && formData.Photo ? (
                          <img 
                            src={`http://localhost:5000/uploads/${formData.Photo}`} 
                            alt="Employee Profile" 
                            style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: `1px solid ${C.borderLight}` }} 
                          />
                        ) : (
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            style={{ ...styles.input, background: '#f8fafc', padding: '10px' }} 
                          />
                        )}
                        {isEditMode && formData.Photo && !selectedFile && (
                          <div style={{ marginTop: '8px', fontSize: '13px', color: C.muted }}>
                            Current Photo: {formData.Photo}
                          </div>
                        )}
                      </div>

                      <FormGroup label="First Name" name="FirstName" value={formData.FirstName} onChange={handleChange} required />
                      <FormGroup label="Middle Name" name="MiddleName" value={formData.MiddleName} onChange={handleChange} />
                      <FormGroup label="Last Name" name="LastName" value={formData.LastName} onChange={handleChange} required />
                      <FormGroup label="Date of Birth" name="DateOfBirth" type="date" value={formData.DateOfBirth} onChange={handleChange} />
                      
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Gender</label>
                        <select name="Gender" value={formData.Gender} onChange={handleChange} style={styles.input}>
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Marital Status</label>
                        <select name="MaritalStatus" value={formData.MaritalStatus} onChange={handleChange} style={styles.input}>
                          <option value="">Select...</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                        </select>
                      </div>

                      <FormGroup label="Blood Group" name="BloodGroup" value={formData.BloodGroup} onChange={handleChange} />
                      <FormGroup label="Nationality" name="Nationality" value={formData.Nationality} onChange={handleChange} />
                      <FormGroup label="Nominee Name" name="NomineeName" value={formData.NomineeName} onChange={handleChange} />
                      <FormGroup label="Nominee Relation" name="NomineeRelation" value={formData.NomineeRelation} onChange={handleChange} />
                    </div>
                  )}

                  {/* TAB 2: Contact Details */}
                  {activeTab === 'Contact' && (
                    <div style={styles.grid}>
                      <FormGroup label="Primary Email ID" name="EmailId" type="email" value={formData.EmailId} onChange={handleChange} required />
                      <FormGroup label="Alternate Email ID" name="AlternateEmailId" type="email" value={formData.AlternateEmailId} onChange={handleChange} />
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}><FormGroup label="Code" name="CountryCode1" value={formData.CountryCode1} onChange={handleChange} /></div>
                        <div style={{ flex: 3 }}><FormGroup label="Current Contact No" name="CurrentContactNo" value={formData.CurrentContactNo} onChange={handleChange} required /></div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}><FormGroup label="Code" name="CountryCode2" value={formData.CountryCode2} onChange={handleChange} /></div>
                        <div style={{ flex: 3 }}><FormGroup label="Alternate Contact No" name="AlternateContactNo" value={formData.AlternateContactNo} onChange={handleChange} /></div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}><FormGroup label="Code" name="CountryCode3" value={formData.CountryCode3} onChange={handleChange} /></div>
                        <div style={{ flex: 3 }}><FormGroup label="Emergency Contact No" name="EmergencyContactNo" value={formData.EmergencyContactNo} onChange={handleChange} /></div>
                      </div>

                      <FormGroup label="Current Address" name="CurrentAddress" value={formData.CurrentAddress} onChange={handleChange} />
                      <FormGroup label="Permanent Address" name="PermanantAddress" value={formData.PermanantAddress} onChange={handleChange} />
                    </div>
                  )}

                  {/* TAB 3: Job Details */}
                  {activeTab === 'Job Details' && (
                    <div style={styles.grid}>
                      
                      <div style={styles.formGroup}>
                        <label style={styles.label}>System Role <span style={{color: 'red'}}>*</span></label>
                        <select name="role" value={formData.role} onChange={handleChange} required style={styles.input}>
                          <option value="">Select Role...</option>
                          <option value="admin">Admin</option>
                          <option value="hr">HR</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="employee">Employee</option>
                        </select>
                      </div>

                      <FormGroup label="Password" name="Password" type="password" value={formData.Password} onChange={handleChange} required />
                      
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Employee Status</label>
                        <select name="Status" value={formData.Status} onChange={handleChange} style={styles.input}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.label}>Status Of Employee (Type)</label>
                        <select 
                          name="StatusOfEmployee" 
                          value={formData.StatusOfEmployee} 
                          onChange={handleChange} 
                          style={styles.input}
                        >
                          <option value="">Select Employment Type...</option>
                          {employeeStatuses.map((statusItem) => (
                            <option key={statusItem.id} value={statusItem.employee_status}>
                              {statusItem.employee_status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <FormGroup label="Department ID" name="Department" type="number" value={formData.Department} onChange={handleChange} />
                      <FormGroup label="Designation ID" name="Designation" type="number" value={formData.Designation} onChange={handleChange} />
                      <FormGroup label="Designation Start Date" name="DesignationStartDate" type="date" value={formData.DesignationStartDate} onChange={handleChange} />
                      <FormGroup label="Designation End Date" name="DesignationEndDate" type="date" value={formData.DesignationEndDate} onChange={handleChange} />
                      <FormGroup label="Joining Date" name="StartDate" type="date" value={formData.StartDate} onChange={handleChange} />
                      <FormGroup label="End Date" name="EndDate" type="date" value={formData.EndDate} onChange={handleChange} />
                      <FormGroup label="Company Branch ID" name="CompanyBranch" type="number" value={formData.CompanyBranch} onChange={handleChange} />
                      <FormGroup label="Working Branch ID" name="WorkingBranch" type="number" value={formData.WorkingBranch} onChange={handleChange} />
                      <FormGroup label="Work Location" name="WorkLocation" value={formData.WorkLocation} onChange={handleChange} />

                      <div style={styles.formGroup}>
                        <label style={styles.label}>Direct Supervisor</label>
                        <select 
                          name="DirectSupervisor" 
                          value={formData.DirectSupervisor} 
                          onChange={handleChange} 
                          style={styles.input}
                        >
                          <option value="">Select Direct Supervisor...</option>
                          {supervisors.map((sup) => (
                            <option key={`direct-${sup.EmployeeID}`} value={sup.EmployeeID}>
                              {sup.FirstName} {sup.LastName} (ID: {sup.EmployeeID})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.label}>Indirect Supervisor</label>
                        <select 
                          name="IndirectSupervisor" 
                          value={formData.IndirectSupervisor} 
                          onChange={handleChange} 
                          style={styles.input}
                        >
                          <option value="">Select Indirect Supervisor...</option>
                          {supervisors.map((sup) => (
                            <option key={`indirect-${sup.EmployeeID}`} value={sup.EmployeeID}>
                              {sup.FirstName} {sup.LastName} (ID: {sup.EmployeeID})
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>
                  )}

                  {/* TAB 4: Financial & ID */}
                  {activeTab === 'Financial & ID' && (
                    <div style={styles.grid}>
                      <h4 style={{ gridColumn: '1 / -1', color: C.primary, margin: '10px 0 0 0' }}>Banking Details</h4>
                      <FormGroup label="Account Holder Name" name="AccountHolderName" value={formData.AccountHolderName} onChange={handleChange} />
                      <FormGroup label="Bank Name" name="BankName" value={formData.BankName} onChange={handleChange} />
                      <FormGroup label="Account Number" name="AccountNumber" value={formData.AccountNumber} onChange={handleChange} />
                      <FormGroup label="IFSC Code" name="IFSCCode" value={formData.IFSCCode} onChange={handleChange} />
                      <FormGroup label="Bank Branch" name="Branch" value={formData.Branch} onChange={handleChange} />
                      <FormGroup label="NEFT Status" name="NEFT" value={formData.NEFT} onChange={handleChange} />

                      <h4 style={{ gridColumn: '1 / -1', color: C.primary, margin: '10px 0 0 0', borderTop: `1px solid ${C.borderLight}`, paddingTop: '15px' }}>Government IDs</h4>
                      <FormGroup label="PAN Number" name="PANNo" value={formData.PANNo} onChange={handleChange} />
                      <FormGroup label="Aadhar Number" name="AadharNo" value={formData.AadharNo} onChange={handleChange} />
                      <FormGroup label="PF Number" name="PFNo" value={formData.PFNo} onChange={handleChange} />
                      <FormGroup label="PF UAN Number" name="PFUANNo" value={formData.PFUANNo} onChange={handleChange} />
                      <FormGroup label="ESIC Number" name="ESICNo" value={formData.ESICNo} onChange={handleChange} />
                      <FormGroup label="Driving License" name="DrivingLicense" value={formData.DrivingLicense} onChange={handleChange} />
                      <FormGroup label="DL Expiry Date" name="ExpiryDrivingLicense" type="date" value={formData.ExpiryDrivingLicense} onChange={handleChange} />
                      <FormGroup label="Passport Number" name="PassportNo" value={formData.PassportNo} onChange={handleChange} />
                      <FormGroup label="Passport Location" name="PassportLocation" value={formData.PassportLocation} onChange={handleChange} />
                    </div>
                  )}
                </fieldset>
              </div>

              {/* Form Actions Footer */}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px', paddingTop: '16px', borderTop: `1px solid ${C.borderLight}` }}>
                <button type="button" onClick={closeModal} style={styles.cancelBtn}>
                  {isViewMode ? 'Close' : 'Cancel'}
                </button>
                
                {!isViewMode && (
                  <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
                    {isSubmitting 
                      ? (isEditMode ? 'Updating...' : 'Saving...') 
                      : (isEditMode ? 'Update Employee' : 'Save Employee')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Styles Layout ---
const styles = {
  tableContainer: { overflowX: 'auto', backgroundColor: C.card, borderRadius: RADIUS.card, boxShadow: SHADOW.card },
  th: { padding: '16px', color: C.muted, fontWeight: '600', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '16px', color: C.text, fontSize: '14px' },
  statusBadge: { padding: '6px 12px', borderRadius: RADIUS.pill, fontSize: '12px', fontWeight: '600' },
  roleBadge: { backgroundColor: C.inputBg, color: C.primary, border: `1px solid ${C.inputBorder}`, padding: '4px 8px', borderRadius: RADIUS.button, fontSize: '13px', fontWeight: '500', textTransform: 'capitalize' },
  addBtn: { border: "none", background: C.accent, color: "#fff", padding: "14px 22px", borderRadius: "14px", fontWeight: "600", cursor: "pointer", boxShadow: "0 10px 24px rgba(214,58,110,.25)" },
  actionBtn: {
    view: { backgroundColor: 'transparent', color: C.primary, border: `1px solid ${C.primary}`, padding: '6px 12px', borderRadius: RADIUS.button, cursor: 'pointer', marginRight: '8px', fontSize: '13px', fontWeight: '500' },
    edit: { backgroundColor: 'transparent', color: C.warning, border: `1px solid ${C.warning}`, padding: '6px 12px', borderRadius: RADIUS.button, cursor: 'pointer', marginRight: '8px', fontSize: '13px', fontWeight: '500' },
    archive: { backgroundColor: 'transparent', color: C.danger, border: `1px solid ${C.danger}`, padding: '6px 12px', borderRadius: RADIUS.button, cursor: 'pointer', fontSize: '13px', fontWeight: '500' }
  },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { backgroundColor: '#fff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  scrollableFormArea: { overflowY: 'auto', paddingRight: '10px', maxHeight: '50vh' },
  closeModalBtn: { background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#64748b', lineHeight: '1' },
  tabContainer: { display: 'flex', borderBottom: '2px solid #e5edf4', marginBottom: '24px', overflowX: 'auto' },
  activeTab: { padding: '12px 24px', backgroundColor: 'transparent', border: 'none', borderBottom: '3px solid #3ea0cf', color: '#3ea0cf', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },
  inactiveTab: { padding: '12px 24px', backgroundColor: 'transparent', border: 'none', color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '15px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column' },
  label: { marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#334155' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #e5edf4', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none' },
  submitBtn: { border: "none", background: "#d63a6e", color: "#fff", padding: "12px 24px", borderRadius: "10px", fontWeight: "600", cursor: "pointer" },
  cancelBtn: { backgroundColor: 'transparent', color: '#64748b', border: '1px solid #e5edf4', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }
};

export default Employees;