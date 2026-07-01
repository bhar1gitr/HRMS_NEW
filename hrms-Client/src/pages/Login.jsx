import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "/src/assets/full.png";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.identifier || !form.password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: form.identifier,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      // Save Auth Data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role);

      // Dynamic Router Allocation Matrix (Supporting Leader)
      const normalizedRole = data.user.role ? data.user.role.toLowerCase() : "";

      if (normalizedRole === "admin" || normalizedRole === "hr") {
        navigate("/admin/dashboard");
      } else if (normalizedRole === "manager") {
        navigate("/manager/timesheet");
      } else if (normalizedRole === "leader") {
        // FIXED: Route leaders to their view-only executive timeline workspace
        navigate("/leader/timesheet");
      } else {
        navigate("/employee/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundIcons}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            style={{
              ...styles.icon,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${18 + Math.random() * 14}px`,
              opacity: 0.15 + Math.random() * 0.1,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          >
            {["🩺", "🧬", "⚕️", "🔬", "✚", "🧪", "📊", "👩‍⚕️", "🔄", "📋"][i % 10]}
          </span>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img src={logo} alt="Clinnex" style={styles.fullLogo} />
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Enter Email-Id or EmployeeID</label>
            <input
              type="text"
              name="identifier"
              value={form.identifier}
              onChange={handleChange}
              placeholder="Enter Email-Id or EmployeeID"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter Password"
                style={styles.input}
                required
              />
              <span
                style={styles.toggleText}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </span>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.85 : 1,
            }}
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div style={styles.forgotContainer}>
          <span
            style={styles.forgotLink}
            onClick={() => alert("Password reset link will be sent to your email")}
          >
            Forgot Your Password?
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { position: "fixed", inset: 0, width: "100vw", height: "100vh", background: "linear-gradient(135deg, #0d2d3d 0%, #1a6080 100%)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif" },
  backgroundIcons: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none" },
  icon: { position: "absolute", transition: "all 25s linear" },
  card: { background: "rgba(255,255,255,0.98)", width: "92%", maxWidth: "520px", padding: "56px 48px", borderRadius: "24px", boxShadow: "0 30px 80px rgba(0,0,0,0.25)", position: "relative", zIndex: 2, textAlign: "center" },
  logoContainer: { height: "100px", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "20px" },
  fullLogo: { width: "280px", marginTop: "-40px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  field: { textAlign: "left" },
  label: { display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#2b7da1" },
  input: { width: "100%", padding: "14px 16px", border: "1px solid #a8d4e6", borderRadius: "10px", fontSize: "15px", backgroundColor: "#f0f8fc", outline: "none" },
  passwordWrapper: { position: "relative" },
  toggleText: { position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "#2b7da1", fontSize: "14px", fontWeight: "500", cursor: "pointer", userSelect: "none" },
  submitButton: { marginTop: "12px", padding: "15px", backgroundColor: "#d63a6e", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  error: { backgroundColor: "#fde8ef", color: "#d63a6e", padding: "12px", borderRadius: "8px", fontSize: "14px" },
  forgotContainer: { marginTop: "24px" },
  forgotLink: { color: "#d63a6e", cursor: "pointer", fontSize: "14px", textDecoration: "underline" },
};