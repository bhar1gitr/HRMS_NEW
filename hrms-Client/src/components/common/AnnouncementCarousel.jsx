import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C, SHADOW, RADIUS } from "../../theme";

export default function AnnouncementCarousel({ 
  announcements, 
  onContinue, 
  showContinue = true,
  continueText = "Continue To Dashboard →"
}) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Get user role from localStorage
  const userRole = localStorage.getItem("role") || "employee";

  useEffect(() => {
    if (announcements.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % announcements.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [announcements.length]);

  const handleAnnouncementClick = (announcement) => {
    // Navigate based on user role
    let basePath = "/employee";
    let viewPath = "announcements";
    
    if (userRole === "admin" || userRole === "hr") {
      basePath = "/admin";
      viewPath = "announcements-view"; // Admin uses different path
    } else if (userRole === "manager") {
      basePath = "/manager";
    }
    
    navigate(`${basePath}/${viewPath}/${announcement.id}`, { 
      state: { announcement } 
    });
  };

  const formatDateLabel = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  if (!announcements || announcements.length === 0) {
    return null;
  }

  const current = announcements[currentSlide];
  const bannerImg = current.Photo 
    ? `http://localhost:5000/uploads/${current.Photo}`
    : "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200";

  return (
    <div style={styles.welcomePage}>
      <div style={styles.carouselContainer}>
        <h1 style={styles.carouselHeader}>📢 Latest Announcements</h1>

        <div 
          style={styles.carouselCard}
          onClick={() => handleAnnouncementClick(current)}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <img 
            src={bannerImg} 
            alt="Announcement banner"
            style={styles.carouselImage}
          />
          <div style={styles.overlay}>
            <div style={styles.carouselDate}>
              Published: {formatDateLabel(current.NoticeDate)}
            </div>
            <h3 style={styles.carouselTitleText}>
              {current.Notice?.substring(0, 70)}...
            </h3>
            <p style={styles.carouselDesc}>{current.Notice}</p>
          </div>
        </div>

        <div style={styles.dots}>
          {announcements.map((_, index) => (
            <span
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                ...styles.dot,
                background: currentSlide === index ? C.primary : "transparent",
              }}
            />
          ))}
        </div>
      </div>

      {showContinue && (
        <button style={styles.continueBtn} onClick={onContinue}>
          {continueText}
        </button>
      )}
    </div>
  );
}

const styles = {
  welcomePage: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "88vh",
    padding: "40px 20px",
    background: "#fff",
  },
  carouselContainer: {
    width: "100%",
    maxWidth: "900px",
    marginBottom: "48px",
  },
  carouselHeader: {
    textAlign: "center",
    color: C.text,
    marginBottom: "40px",
    fontSize: "34px",
    fontWeight: "700",
  },
  carouselCard: {
    height: "380px",
    borderRadius: RADIUS.card,
    overflow: "hidden",
    position: "relative",
    cursor: "pointer",
    boxShadow: SHADOW.card,
    transition: "transform 0.4s ease, box-shadow 0.4s ease",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(13,45,61,0.92) 75%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "48px 40px",
  },
  carouselDate: {
    color: "#cbd5e1",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  carouselTitleText: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "12px",
    lineHeight: "1.2",
  },
  carouselDesc: {
    fontSize: "15px",
    color: "#e2e8f0",
    lineHeight: "1.6",
    maxWidth: "90%",
    display: "-webkit-box",
    WebkitLineClamp: "3",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  dots: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginTop: "32px",
  },
  dot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "all 0.3s",
    border: `2px solid ${C.primary}`,
  },
  continueBtn: {
    border: "none",
    background: C.accent,
    color: "#fff",
    padding: "16px 44px",
    borderRadius: RADIUS.button,
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(214, 58, 110, 0.3)",
    transition: "all 0.2s ease",
  },
};