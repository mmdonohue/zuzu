import React, { useEffect } from "react";

const Portfolio: React.FC = () => {
  useEffect(() => {
    // Redirect to the static HTML file
    window.location.href = "/assets/html/resume_gemini2.html";
  }, []);

  return (
    <div style={{ 
      width: "100%", 
      height: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      flexDirection: "column",
      padding: "20px"
    }}>
      <p style={{ color: "#666" }}>Redirecting to portfolio...</p>
    </div>
  );
};

export default Portfolio;
