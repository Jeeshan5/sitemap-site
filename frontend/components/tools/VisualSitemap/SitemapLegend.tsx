"use client";
import React from "react";

interface LegendProps {
  theme?: "light" | "dark";
}

const LEGEND_ITEMS = [
  { color: "#10b981", label: "Normal Page" },        // green / teal
  { color: "#9ca3af", label: "Redirect / Canonical" }, // gray
  { color: "#fde047", label: "NoIndex / Blocked" },  // yellow
  { color: "#ef4444", label: "Error / Broken Link" } // red
];

const SitemapLegend: React.FC<LegendProps> = ({ theme = "light" }) => {
  return (
    <div
      className={`rounded-xl shadow-lg border backdrop-blur-md px-4 py-3 text-sm transition ${
        theme === "dark"
          ? "bg-slate-900/80 border-slate-700 text-white"
          : "bg-white/90 border-slate-200 text-slate-800"
      }`}
      style={{ width: "210px" }}
    >
      <h4 className="font-semibold mb-2">Legend</h4>

      <div className="space-y-2">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-sm border"
              style={{
                background: item.color,
                borderColor: theme === "dark" ? "#ffffff30" : "#00000020"
              }}
            ></div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SitemapLegend;
