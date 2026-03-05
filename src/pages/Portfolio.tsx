import React, { useEffect, useRef, useState } from "react";

const Portfolio: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load the HTML file
    const loadHTML = async () => {
      try {
        const response = await fetch("/assets/html/resume_gemini2.html");
        
        if (!response.ok) {
          throw new Error(`Failed to load portfolio: ${response.status} ${response.statusText}`);
        }
        
        const html = await response.text();
        
        if (iframeRef.current) {
          const iframeDoc = iframeRef.current.contentDocument;
          if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(html);
            iframeDoc.close();
          }
        }
      } catch (error) {
        console.error("Error loading portfolio HTML:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    };

    loadHTML();
  }, []);

  if (error) {
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
        <h2 style={{ color: "#ef4444", marginBottom: "10px" }}>Error Loading Portfolio</h2>
        <p style={{ color: "#666" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <iframe
        ref={iframeRef}
        title="Portfolio"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    </div>
  );
};

export default Portfolio;
