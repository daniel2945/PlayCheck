import React, { useState, useEffect } from "react";

export default function ResultsDashboard({ results }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay to ensure the transition triggers after initial paint
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!results) return null;

  const minScore = Math.min(
    results.cpuScore,
    results.gpuScore,
    results.ramScore,
  );
  const hasBottleneck = minScore < 80;

  const hardwareComponents = [
    {
      id: "cpu",
      title: "CPU",
      icon: "🧠",
      score: results.cpuScore,
      userSpec: results.cpuUser,
      reqSpec: results.cpuReq,
    },
    {
      id: "gpu",
      title: "GPU",
      icon: "🎮",
      score: results.gpuScore,
      userSpec: results.gpuUser,
      reqSpec: results.gpuReq,
    },
    {
      id: "ram",
      title: "RAM",
      icon: "⚡",
      score: results.ramScore,
      userSpec: results.ramUser,
      reqSpec: results.ramReq,
    },
  ];

  const cleanHardwareName = (name) => {
    if (!name) return "N/A";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
      return parts.slice(1).join(" ");
    }
    return name;
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto mb-12 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-black rounded-[2.5rem] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-white/10 overflow-hidden">
      {/* Ambient Light Blobs (RGB Vibe) */}
      <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[5%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hardwareComponents.map((comp) => {
            const isBottleneck = hasBottleneck && comp.score === minScore;
            const isUltra = comp.score >= 100 && !isBottleneck;
            const isGreat =
              comp.score >= 80 && comp.score < 100 && !isBottleneck;
            const displayScore = comp.score > 200 ? "200+" : comp.score;

            // Visual max is 150. Allows marker to sit nicely inside the green zone for scores > 100
            const markerPositionPercent = Math.min(
              (comp.score / 150) * 100,
              100,
            );

            let cardClasses =
              "relative flex flex-col p-6 rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1 hover:z-50 group ";

            if (isBottleneck) {
              cardClasses +=
                "border-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.3)] hover:shadow-[0_0_40px_rgba(225,29,72,0.5)] hover:border-rose-400 ";
            } else if (isUltra) {
              cardClasses +=
                "border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:border-emerald-400 ";
            } else if (isGreat || (!hasBottleneck && comp.score >= 80)) {
              cardClasses +=
                "border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:border-cyan-400 ";
            } else {
              cardClasses +=
                "hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] ";
            }

            // Determine visual styling for score numbers based on glowing states
            let scoreColorClass = "text-[#8ab4f8]";
            if (isBottleneck)
              scoreColorClass =
                "text-rose-500 drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]";
            else if (isUltra)
              scoreColorClass =
                "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]";
            else if (isGreat || (!hasBottleneck && comp.score >= 80))
              scoreColorClass =
                "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]";

            return (
              <div key={comp.id} className={cardClasses}>
                {isBottleneck && (
                  <div className="absolute top-0 left-0 w-full bg-rose-600/90 border-b border-rose-400/50 text-white text-[11px] font-bold text-center py-1.5 uppercase tracking-widest shadow-md z-20 rounded-t-2xl">
                    ⚠️ BOTTLENECK DETECTED
                  </div>
                )}

                <div
                  className={`flex justify-between items-end mb-4 ${isBottleneck ? "mt-4" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl drop-shadow-md">{comp.icon}</span>
                    <h3 className="text-xl font-bold text-[#e8eaed] tracking-wide drop-shadow-md">
                      {comp.title}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-[#9aa0a6] uppercase tracking-widest mb-0.5">
                      Score
                    </span>
                    <span className={`text-3xl font-black ${scoreColorClass}`}>
                      {displayScore}
                    </span>
                  </div>
                </div>

                <div className="relative mt-2 mb-6">
                  <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-[#09090b] border border-black/50 shadow-inner">
                    <div
                      className="bg-rose-500 opacity-80"
                      style={{ width: "26.6%" }}
                    ></div>
                    <div
                      className="bg-orange-500 opacity-80"
                      style={{ width: "26%" }}
                    ></div>
                    <div
                      className="bg-cyan-400 opacity-80"
                      style={{ width: "13.3%" }}
                    ></div>
                    <div
                      className="bg-emerald-500 opacity-80"
                      style={{ width: "34.1%" }}
                    ></div>
                  </div>

                  <div
                    className="absolute top-[-5px] bottom-[-5px] w-[2px] bg-white shadow-[0_0_8px_white] z-10 transition-all duration-1000 ease-out"
                    style={{
                      left: mounted
                        ? `calc(${markerPositionPercent}% - 2px)`
                        : "0%",
                    }}
                  >
                    <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent border-t-white"></div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-auto bg-black/20 p-4 rounded-xl border border-white/5 shadow-inner">
                  <div className="group/tooltip relative flex flex-col border-b border-white/5 pb-2 min-w-0">
                    <span className="text-[10px] text-[#9aa0a6] uppercase tracking-widest mb-1">
                      Your PC
                    </span>
                    <span className="text-sm font-medium text-[#8ab4f8] truncate block w-full cursor-help">
                      {cleanHardwareName(comp.userSpec)}
                    </span>
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-max max-w-[250px] whitespace-normal bg-slate-900 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-50 pointer-events-none">
                      {cleanHardwareName(comp.userSpec)}
                    </div>
                  </div>
                  <div className="group/tooltip relative flex flex-col min-w-0">
                    <span className="text-[10px] text-[#9aa0a6] uppercase tracking-widest mb-1">
                      Recommended
                    </span>
                    <span className="text-sm font-medium text-[#e8eaed] truncate block w-full cursor-help">
                      {comp.reqSpec || "N/A"}
                    </span>
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-max max-w-[250px] whitespace-normal bg-slate-900 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-50 pointer-events-none">
                      {comp.reqSpec || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FINAL VERDICT SECTION */}
        {(() => {
          const overall = results.overallScore || 0;
          const displayOverall = overall > 150 ? "150+" : overall;
          let gaugeColor = "#f43f5e"; // rose-500
          let glowColor = "rgba(244,63,94,0.3)";

          if (overall >= 95) {
            gaugeColor = "#10b981"; // emerald-500
            glowColor = "rgba(16,185,129,0.3)";
          } else if (overall >= 80) {
            gaugeColor = "#06b6d4"; // cyan-500
            glowColor = "rgba(6,182,212,0.3)";
          } else if (overall >= 50) {
            gaugeColor = "#f59e0b"; // amber-500
            glowColor = "rgba(245,158,11,0.3)";
          }

          const radius = 70;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset =
            circumference -
            ((mounted ? Math.min(overall, 100) : 0) / 100) * circumference;

          const scoreText = `${displayOverall}%`;
          const isLongScore = scoreText.length >= 4;

          return (
            <div className="mt-8 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-8 flex flex-col items-center shadow-2xl transition-all duration-300 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1">
              <h3 className="text-2xl text-[#e8eaed] mb-8 border-b border-white/10 pb-4 font-bold w-full text-left drop-shadow-lg">
                Final Compatibility Verdict
              </h3>

              <div className="relative flex flex-col items-center">
                <div className="relative w-48 h-48 flex items-center justify-center mt-2">
                  {/* Background Ambient Glow */}
                  <div
                    className="absolute inset-0 rounded-full blur-2xl pointer-events-none"
                    style={{ backgroundColor: glowColor }}
                  ></div>

                  <svg
                    className="absolute top-0 left-0 w-full h-full transform -rotate-90 z-10"
                    style={{ filter: `drop-shadow(0 0 10px ${gaugeColor}80)` }}
                  >
                    <circle
                      cx="96"
                      cy="96"
                      r={radius}
                      stroke="#202124"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r={radius}
                      stroke={gaugeColor}
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  <div className="text-center z-20 flex flex-col items-center px-2">
                    <span
                      className={`${
                        isLongScore ? "text-3xl" : "text-4xl"
                      } font-black drop-shadow-md tracking-tight transition-all duration-300`}
                      style={{ color: gaugeColor }}
                    >
                      {scoreText}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
