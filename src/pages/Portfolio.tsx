import React, { useEffect, useRef } from "react";

const Portfolio: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Load the HTML file
    const loadHTML = async () => {
      try {
        const response = await fetch("/assets/html/resume_gemini2.html");
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
      }
    };

    loadHTML();
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <iframe
        ref={iframeRef}
        title="Portfolio"
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
