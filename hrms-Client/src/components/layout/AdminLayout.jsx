import { Outlet } from "react-router-dom";
import { C, SPACING } from "../../theme";
import Sidebar from "./AdminSidebar";
import Topbar from "./Topbar";

// Remove { children } from the props
export default function AdminLayout() {
  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <Topbar />
        {/* Replace {children} with <Outlet /> */}
        <div style={styles.content}>
          <Outlet /> 
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: "flex", minHeight: "100vh", background: C.bg },
  main: {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  marginLeft: "250px",
  minWidth: 0,
},
  content: {
  flex: 1,
  padding: SPACING.pagePadding,
  minHeight: "calc(100vh - 64px)",
  overflowY: "auto",
  overflowX: "hidden",
},
};