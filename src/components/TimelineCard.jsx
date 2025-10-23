import React from "react";

const TimelineCard = ({ time, content, links = [], onClose }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "640px",
        background: "white",
        padding: "12px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        maxWidth: "250px",
        zIndex: 50,
        wordBreak: "break-word", // 自動換行
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>提示 @ {time.toFixed(1)}s</strong>
        <button
          onClick={onClose}
          style={{ border: "none", background: "none", cursor: "pointer" }}
        >
          ✕
        </button>
      </div>
      <p style={{ marginTop: "5px" }}>{content}</p>
      {links.length > 0 && (
        <div style={{ marginTop: "5px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {links.map((link, index) => (
            <a
              key={index}
              href={link}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#2563eb",
                textDecoration: "underline",
                fontSize: "0.9rem",
              }}
            >
              前往連結 {index + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimelineCard;
