import React, { useState, useEffect } from "react";
import API_CALL from "../../api/API_CALL";
import HardwareInput from "../HardwareInput";

export default function ResultsDashboard({
  data, setData, gameId, setLoading, setError,
  isSimulating, setIsSimulating, resetSimulation
}) {
  const [mounted, setMounted] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [hardwareList, setHardwareList] = useState({ cpus: [], gpus: [] });
  const [testSpecs, setTestSpecs] = useState({ cpuId: "", gpuId: "", ramGb: 16 });
  const [isHardwareLoading, setIsHardwareLoading] = useState(false);
  
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!data) return null;

  const getScore = (part) => {
    if (data.componentScores && data.componentScores[part]) {
      return data.componentScores[part].score;
    }
    return data.components?.[part] === "optimal" ? 100 : (data.components?.[part] === "okay" ? 75 : 30);
  };

  const cpuScore = getScore("cpu");
  const gpuScore = getScore("gpu");
  const ramScore = getScore("ram");

  const minScore = Math.min(cpuScore, gpuScore, ramScore);
  const hasBottleneck = minScore < 80;

  const hardwareComponents = [
    { 
      id: "cpu", title: "CPU", icon: "🧠", score: cpuScore, 
      userSpec: data.specsDetails?.cpu?.user, 
      minSpec: data.specsDetails?.cpu?.min,
      reqSpec: data.specsDetails?.cpu?.rec 
    },
    { 
      id: "gpu", title: "GPU", icon: "🎮", score: gpuScore, 
      userSpec: data.specsDetails?.gpu?.user, 
      minSpec: data.specsDetails?.gpu?.min,
      reqSpec: data.specsDetails?.gpu?.rec 
    },
    { 
      id: "ram", title: "RAM", icon: "⚡", score: ramScore, 
      userSpec: data.specsDetails?.ram?.user, 
      minSpec: data.specsDetails?.ram?.min,
      reqSpec: data.specsDetails?.ram?.rec 
    },
  ];

  const cleanHardwareName = (name) => {
    if (!name || name.toLowerCase().includes("unknown")) return "Not specified";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
      return parts.slice(1).join(" ");
    }
    return name;
  };

  const formatSpec = (spec) => {
    if (!spec || spec.toLowerCase().includes("unknown")) return "Not specified";
    return spec;
  };

  const fetchAiRecommendations = async (compId) => {
    setIsAiLoading(true);
    setEditingPart(compId);
    setAiRecommendations(null);

    try {
      const baseScore = data.specsDetails[compId].recScore || data.specsDetails[compId].minScore || 1000; 
      // 2% מרחב ביטחון, כדי שהציון יעמוד סביב 100-105 בצורה אופטימלית
      const targetScore = Math.ceil(baseScore * 1.02); 
      
      const res = await API_CALL(`/api/hardware/upgrades/${compId}?targetScore=${targetScore}`);
      
      if (res.success) {
        setAiRecommendations(res.data);
      }
    } catch (err) {
      console.error("Failed to get AI recommendations:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const openEditMode = async (partId) => {
    setEditingPart(partId);
    setAiRecommendations(null); 

    if (hardwareList.cpus.length === 0) {
      setIsHardwareLoading(true);
      try {
        const res = await API_CALL("/api/hardware");
        if (res.success) {
          const cpus = res.data.filter((h) => h.type === "CPU");
          const gpus = res.data.filter((h) => h.type === "GPU");
          setHardwareList({ cpus, gpus });

          const currentCpuStr = cleanHardwareName(data?.specsDetails?.cpu?.user);
          const currentGpuStr = cleanHardwareName(data?.specsDetails?.gpu?.user);
          const currentRamStr = data?.specsDetails?.ram?.user;

          const matchedCpu = cpus.find(c => cleanHardwareName(`${c.brand} ${c.model}`) === currentCpuStr) || cpus[0];
          const matchedGpu = gpus.find(g => cleanHardwareName(`${g.brand} ${g.model}`) === currentGpuStr) || gpus[0];
          const matchedRam = currentRamStr ? parseInt(currentRamStr) : 16;

          setTestSpecs(prev => ({
            cpuId: prev.cpuId || matchedCpu?._id || "",
            gpuId: prev.gpuId || matchedGpu?._id || "",
            ramGb: prev.ramGb || matchedRam
          }));
        }
      } catch (err) {
        console.error("Failed to load hardware list", err);
      } finally {
        setIsHardwareLoading(false);
      }
    }
  };

  const handleTestSubmit = async () => {
    if (!testSpecs.cpuId || !testSpecs.gpuId || !testSpecs.ramGb) {
      alert("Please ensure all components (CPU, GPU, RAM) are selected.");
      return;
    }
    setEditingPart(null);
    setLoading(true);
    try {
      const result = await API_CALL(`/api/game/guest/check/${gameId}`, "POST", {
        myPc: { cpuId: testSpecs.cpuId, gpuId: testSpecs.gpuId, ramGb: Number(testSpecs.ramGb) },
      });
      setData(prev => ({ ...result.data, gameImage: prev.gameImage }));
      setIsSimulating(true);
    } catch (err) {
      setError(err.message || "Simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto mb-12 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-black rounded-[2.5rem] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-white/10 overflow-hidden">
      <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[5%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col">
        
        {isSimulating ? (
          <div className="flex justify-between items-center bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-8 shadow-sm">
            <span className="text-cyan-400 font-bold tracking-wide flex items-center gap-2">
              <span className="text-xl">⚙️</span> Simulation Mode Active
            </span>
            <button
              onClick={resetSimulation}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-500 transition-colors shadow"
            >
              Reset to My PC
            </button>
          </div>
        ) : (
          <div className="flex items-start sm:items-center gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-5 mb-8 transition-all hover:bg-white/[0.04]">
            <span className="text-2xl drop-shadow-md hidden sm:block">💡</span>
            <p className="text-[#9aa0a6] text-sm leading-relaxed flex-1">
              <span className="text-[#e8eaed] font-bold text-base block mb-1">Curious about upgrading?</span>
              Click the <strong className="text-white bg-black/40 px-1.5 py-0.5 rounded border border-white/10 mx-1">⚙️ icon</strong> on any component below to test a manual hardware swap, or hit the <strong className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 mx-1">✨ Auto Upgrade</strong> button to let us instantly find the best matching parts for you!
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hardwareComponents.map((comp) => {
            const isBottleneck = hasBottleneck && comp.score === minScore;
            const isUltra = comp.score >= 100 && !isBottleneck;
            const isGreat = comp.score >= 80 && comp.score < 100 && !isBottleneck;
            const displayScore = comp.score > 200 ? "200+" : comp.score;

            const markerPositionPercent = Math.min((comp.score / 150) * 100, 100);

            let cardClasses = "relative flex flex-col p-6 rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1 group ";
            if (isBottleneck) cardClasses += "border-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.3)] hover:shadow-[0_0_40px_rgba(225,29,72,0.5)] hover:border-rose-400 ";
            else if (isUltra) cardClasses += "border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:border-emerald-400 ";
            else if (isGreat || (!hasBottleneck && comp.score >= 80)) cardClasses += "border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:border-cyan-400 ";
            else cardClasses += "hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] ";

            let scoreColorClass = "text-[#8ab4f8]";
            if (isBottleneck) scoreColorClass = "text-rose-500 drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]";
            else if (isUltra) scoreColorClass = "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]";
            else if (isGreat || (!hasBottleneck && comp.score >= 80)) scoreColorClass = "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]";

            return (
              <div key={comp.id} className={cardClasses}>
                <button
                  onClick={() => editingPart === comp.id ? setEditingPart(null) : openEditMode(comp.id)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg border border-white/10 bg-black/40 text-white/50 hover:text-white hover:border-white/30 transition-all z-30"
                  title={`Simulate different ${comp.title}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </button>

                {isBottleneck && (
                  <div className="absolute top-0 left-0 w-full bg-rose-600/90 border-b border-rose-400/50 text-white text-[11px] font-bold text-center py-1.5 uppercase tracking-widest shadow-md z-20 rounded-t-2xl">
                    ⚠️ BOTTLENECK DETECTED
                  </div>
                )}

                <div className={`flex justify-between items-end mb-4 ${isBottleneck ? "mt-4" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl drop-shadow-md">{comp.icon}</span>
                    <h3 className="text-xl font-bold text-[#e8eaed] tracking-wide drop-shadow-md">{comp.title}</h3>
                  </div>
                  <div className="flex flex-col items-end mr-8">
                    <span className="text-[10px] text-[#9aa0a6] uppercase tracking-widest mb-0.5">Score</span>
                    <span className={`text-3xl font-black ${scoreColorClass}`}>{displayScore}</span>
                  </div>
                </div>

                <div className="relative mt-2 mb-6">
                  <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-[#09090b] border border-black/50 shadow-inner">
                    <div className="bg-rose-500 opacity-80" style={{ width: "26.6%" }}></div>
                    <div className="bg-orange-500 opacity-80" style={{ width: "26%" }}></div>
                    <div className="bg-cyan-400 opacity-80" style={{ width: "13.3%" }}></div>
                    <div className="bg-emerald-500 opacity-80" style={{ width: "34.1%" }}></div>
                  </div>
                  <div className="absolute top-[-5px] bottom-[-5px] w-[2px] bg-white shadow-[0_0_8px_white] z-10 transition-all duration-1000 ease-out" style={{ left: mounted ? `calc(${markerPositionPercent}% - 2px)` : "0%" }}>
                    <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent border-t-white"></div>
                  </div>
                </div>

                {editingPart === comp.id ? (
                  <div className="flex flex-col gap-3 mt-auto bg-black/60 p-4 rounded-xl border border-cyan-500/50 shadow-inner animate-in fade-in duration-200 z-20 min-h-[140px]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                        {aiRecommendations ? "Select Upgrade" : `Test different ${comp.title}`}
                      </span>
                      {comp.id !== 'ram' && !aiRecommendations && !isAiLoading && (
                        <button
                          onClick={(e) => { e.preventDefault(); fetchAiRecommendations(comp.id); }}
                          className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded text-[10px] uppercase font-bold hover:bg-emerald-500/20 transition-colors shadow-sm"
                        >
                          ✨ Auto Upgrade
                        </button>
                      )}
                    </div>
                    
                    {isHardwareLoading && comp.id !== 'ram' && !isAiLoading ? (
                      <div className="flex flex-col items-center justify-center flex-1 text-cyan-400 py-4">
                        <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-[10px] uppercase tracking-wider">Loading Data...</span>
                      </div>
                    ) : isAiLoading ? (
                      <div className="flex flex-col items-center justify-center flex-1 text-emerald-400 py-4">
                        <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-[10px] uppercase tracking-wider">Finding best options...</span>
                      </div>
                    ) : aiRecommendations ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1.5">
                          {aiRecommendations.length > 0 ? aiRecommendations.map(rec => (
                            <div
                              key={rec._id}
                              onClick={() => setTestSpecs({...testSpecs, [`${comp.id}Id`]: rec._id})}
                              className={`p-2 rounded-lg border cursor-pointer transition-colors flex justify-between items-center ${
                                testSpecs[`${comp.id}Id`] === rec._id
                                  ? "bg-emerald-500/20 border-emerald-400"
                                  : "bg-[#09090b] border-white/10 hover:border-emerald-500/50"
                              }`}
                            >
                              <span className="text-xs font-bold text-white truncate max-w-[70%]">{rec.brand} {rec.model}</span>
                              <span className="text-[10px] text-emerald-400 font-black bg-emerald-500/10 px-1.5 py-0.5 rounded shadow-sm">
                                {rec.benchmarkScore} Pts
                              </span>
                            </div>
                          )) : (
                            <div className="text-xs text-[#9aa0a6] text-center py-2">No suitable upgrades found in DB.</div>
                          )}
                        </div>

                        <p className="text-[9px] text-[#9aa0a6] text-center mt-1 leading-tight px-1">
                          * AI suggestions aim for optimal performance. Actual results may vary.
                        </p>

                        <div className="flex justify-between items-center mt-2">
                          <button onClick={() => setAiRecommendations(null)} className="text-[10px] text-[#9aa0a6] hover:text-white underline transition-colors">Manual Search</button>
                          <button
                            onClick={handleTestSubmit}
                            disabled={!testSpecs[`${comp.id}Id`]}
                            className="bg-cyan-500 text-black font-bold px-4 py-1.5 rounded hover:bg-cyan-400 transition-colors shadow disabled:opacity-50 text-sm"
                          >
                            Simulate
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {comp.id === 'ram' ? (
                          <input
                            type="number" min="4" max="128" value={testSpecs.ramGb}
                            onChange={(e) => setTestSpecs({ ...testSpecs, ramGb: e.target.value })}
                            className="w-full p-2.5 rounded bg-[#09090b] text-[#e8eaed] border border-white/20 outline-none focus:border-cyan-400 transition-colors"
                          />
                        ) : (
                          <HardwareInput
                            type={comp.title}
                            placeholder={`Search ${comp.title}...`}
                            onSelect={(item) => setTestSpecs({ ...testSpecs, [`${comp.id}Id`]: item ? item._id : "" })}
                          />
                        )}
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setEditingPart(null)} className="text-[#9aa0a6] hover:text-[#e8eaed] px-3 py-1.5 rounded transition-colors text-sm">Cancel</button>
                          <button 
                            onClick={handleTestSubmit} 
                            disabled={comp.id === 'ram' ? !testSpecs.ramGb : !testSpecs[`${comp.id}Id`]}
                            className="bg-cyan-500 text-black font-bold px-4 py-1.5 rounded hover:bg-cyan-400 transition-colors shadow disabled:opacity-50 text-sm"
                          >
                            Simulate
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 mt-auto bg-black/20 p-4 rounded-xl border border-white/5 shadow-inner">
                    <div className="flex flex-col border-b border-white/5 pb-3">
                      <span className="text-[9px] text-[#8ab4f8] uppercase tracking-widest mb-1">
                        {isSimulating ? "Simulated PC" : "Your PC"}
                      </span>
                      <span className="text-xs font-medium text-white/90 leading-relaxed">
                        {cleanHardwareName(comp.userSpec)}
                      </span>
                    </div>

                    <div className="flex flex-col border-b border-white/5 pb-3">
                      <span className="text-[9px] text-[#9aa0a6] uppercase tracking-widest mb-1">Minimum</span>
                      <span className="text-[11px] font-medium text-white/60 leading-relaxed">
                        {formatSpec(comp.minSpec)}
                      </span>
                    </div>

                    <div className="flex flex-col pt-1">
                      <span className="text-[9px] text-[#9aa0a6] uppercase tracking-widest mb-1">Recommended</span>
                      <span className="text-[11px] font-medium text-white/60 leading-relaxed">
                        {formatSpec(comp.reqSpec)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {(() => {
          const overall = data.overallScore !== undefined ? data.overallScore : (data.overall?.toLowerCase() === "optimal" ? 100 : 30);
          const displayOverall = overall > 150 ? "150+" : overall;
          let gaugeColor = "#f43f5e"; 
          let glowColor = "rgba(244,63,94,0.3)";

          if (overall >= 95) { gaugeColor = "#10b981"; glowColor = "rgba(16,185,129,0.3)"; } 
          else if (overall >= 80) { gaugeColor = "#06b6d4"; glowColor = "rgba(6,182,212,0.3)"; } 
          else if (overall >= 50) { gaugeColor = "#f59e0b"; glowColor = "rgba(245,158,11,0.3)"; }

          const radius = 70;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - ((mounted ? Math.min(overall, 100) : 0) / 100) * circumference;
          const scoreText = `${displayOverall}%`;

          return (
            <div className="mt-8 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-8 flex flex-col items-center shadow-2xl transition-all duration-300 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1">
              <h3 className="text-2xl text-[#e8eaed] mb-8 border-b border-white/10 pb-4 font-bold w-full text-left drop-shadow-lg flex items-center gap-3">
                Final Compatibility Verdict
                {isSimulating && (
                  <span className="text-[10px] bg-cyan-500 text-black px-2 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse shadow-sm">
                    Simulated Result
                  </span>
                )}
              </h3>
              <div className="relative flex flex-col items-center">
                <div className="relative w-48 h-48 flex items-center justify-center mt-2">
                  <div className="absolute inset-0 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: glowColor }}></div>
                  <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90 z-10" style={{ filter: `drop-shadow(0 0 10px ${gaugeColor}80)` }}>
                    <circle cx="96" cy="96" r={radius} stroke="#202124" strokeWidth="12" fill="transparent" />
                    <circle cx="96" cy="96" r={radius} stroke={gaugeColor} strokeWidth="12" fill="transparent"
                      strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                      className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="text-center z-20 flex flex-col items-center px-2">
                    <span className={`${scoreText.length >= 4 ? "text-3xl" : "text-4xl"} font-black drop-shadow-md tracking-tight transition-all duration-300`} style={{ color: gaugeColor }}>
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