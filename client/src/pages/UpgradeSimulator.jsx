import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import API_CALL from "../api/API_CALL";
import useAuthStore from "../store/useAuthStore";

export default function UpgradeSimulator() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const isAdmin = user?.role === "admin" || user?.role === "owner";

    const [selectedZone, setSelectedZone] = useState("gpu");
    const [hoveredZone, setHoveredZone] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUpgradeId, setSelectedUpgradeId] = useState(null);
    
    const [ramInput, setRamInput] = useState(16);
    const ramSteps = [4, 8, 16, 32, 64, 128];

    const data = state?.data;
    const gameId = state?.gameId;

    // ==========================================
    // פונקציית ניקוי כפילויות שמות (מונעת Intel Intel)
    // ==========================================
    const cleanHardwareName = (name) => {
        if (!name || name.toLowerCase().includes("unknown")) return "Not specified";
        const parts = name.split(" ").filter(Boolean); // מנקה רווחים כפולים
        if (parts.length > 1 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
            return parts.slice(1).join(" ");
        }
        return parts.join(" ");
    };

    // ==========================================
    // ✨ DEV MODE: POLYGON DRAWING TOOL ✨
    // ==========================================
    const [isDevMode, setIsDevMode] = useState(false);
    const [drawingZone, setDrawingZone] = useState(null);
    const [currentPoints, setCurrentPoints] = useState([]);
    
    const [zones, setZones] = useState(() => {
        const savedZones = localStorage.getItem("hologramZones");
        if (savedZones) return JSON.parse(savedZones);
        
        return [
            { 
              id: "cpu", 
              label: "CPU CORE", 
              icon: "🧠", 
              points: "52.94,44.44 51.95,46.08 49.02,46.08 48.12,44.59 48.09,39.04 48.96,37.30 51.95,37.04 52.97,38.63" 
            },
            { 
              id: "gpu", 
              label: "GPU UNIT", 
              icon: "🎮", 
              points: "50.01,54.30 48.78,52.61 28.33,53.48 27.52,54.92 27.61,66.74 28.12,67.92 49.05,68.84 49.95,67.30" 
            },
            { 
              id: "ram", 
              label: "MEMORY", 
              icon: "⚡", 
              points: "57.35,31.36 57.45,50.81 54.65,50.87 54.51,50.20 54.33,32.45 54.76,31.42" 
            }
        ];
    });

    const handleSvgClick = (e) => {
        if (!isDevMode || !drawingZone || !isAdmin) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setCurrentPoints([...currentPoints, { x: x.toFixed(2), y: y.toFixed(2) }]);
    };

    const savePolygon = () => {
        if (currentPoints.length < 3) {
            alert("A shape must have at least 3 points!");
            return;
        }
        const pointsStr = currentPoints.map(p => `${p.x},${p.y}`).join(" ");
        const newZones = zones.map(z => z.id === drawingZone ? { ...z, points: pointsStr } : z);
        setZones(newZones);
        localStorage.setItem("hologramZones", JSON.stringify(newZones));
        setDrawingZone(null);
        setCurrentPoints([]);
    };

    const getCenter = (pointsStr) => {
        if (!pointsStr) return { x: 0, y: 0 };
        const points = pointsStr.split(" ").map(p => {
            const [x, y] = p.split(",");
            return { x: parseFloat(x), y: parseFloat(y) };
        });
        const sumX = points.reduce((sum, p) => sum + p.x, 0);
        const sumY = points.reduce((sum, p) => sum + p.y, 0);
        return { top: `${sumY / points.length}%`, left: `${sumX / points.length}%` };
    };
    // ==========================================

    useEffect(() => {
        setRecommendations(null);
        setSelectedUpgradeId(null);
        if (selectedZone !== "ram") {
            fetchUpgrades(selectedZone);
        } else {
            const currentRam = parseInt(data?.specsDetails?.ram?.user) || 16;
            const closestStep = ramSteps.reduce((prev, curr) => Math.abs(curr - currentRam) < Math.abs(prev - currentRam) ? curr : prev);
            setRamInput(closestStep);
        }
    }, [selectedZone]);

    const fetchUpgrades = async (zoneId) => {
        setIsLoading(true);
        try {
            const spec = data?.specsDetails?.[zoneId] || {};
            const currentSpecs = `CPU: ${data?.specsDetails?.cpu?.user}, GPU: ${data?.specsDetails?.gpu?.user}, RAM: ${data?.specsDetails?.ram?.user}`;
            const res = await API_CALL(`/api/hardware/upgrades/${zoneId}?userScore=${spec.userScore || 0}&recommendedScore=${spec.recScore || 1000}&currentSpecs=${encodeURIComponent(currentSpecs)}`);
            if (res.success) setRecommendations(res.data);
        } catch (err) {
            console.error("AI Fetch failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRamChange = (direction) => {
        const currentIndex = ramSteps.indexOf(ramInput);
        if (direction === "up" && currentIndex < ramSteps.length - 1) {
            setRamInput(ramSteps[currentIndex + 1]);
            setSelectedUpgradeId(ramSteps[currentIndex + 1]);
        } else if (direction === "down" && currentIndex > 0) {
            setRamInput(ramSteps[currentIndex - 1]);
            setSelectedUpgradeId(ramSteps[currentIndex - 1]);
        }
    };

    const handleSimulate = async () => {
        setIsLoading(true);
        try {
            const resHW = await API_CALL("/api/hardware");
            const cpus = resHW.data.filter((h) => h.type === "CPU");
            const gpus = resHW.data.filter((h) => h.type === "GPU");

            const currentCpuStr = cleanHardwareName(data?.specsDetails?.cpu?.user);
            const currentGpuStr = cleanHardwareName(data?.specsDetails?.gpu?.user);

            const matchedCpuId = cpus.find((c) => cleanHardwareName(`${c.brand} ${c.model}`) === currentCpuStr)?._id || cpus[0]?._id;
            const matchedGpuId = gpus.find((g) => cleanHardwareName(`${g.brand} ${g.model}`) === currentGpuStr)?._id || gpus[0]?._id;

            const myPc = {
                cpuId: selectedZone === "cpu" ? selectedUpgradeId : matchedCpuId,
                gpuId: selectedZone === "gpu" ? selectedUpgradeId : matchedGpuId,
                ramGb: selectedZone === "ram" ? ramInput : parseInt(data?.specsDetails?.ram?.user) || 16,
            };

            const result = await API_CALL(`/api/game/guest/check/${gameId}`, "POST", { myPc });
            
            sessionStorage.setItem("simulatedData", JSON.stringify(result.data));
            sessionStorage.setItem("simulatedSpecs", JSON.stringify(myPc));
            
            navigate(`/game/${gameId}`);
        } catch (err) {
            console.error(err);
            alert("Simulation failed.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-cyan-50 font-sans overflow-hidden flex flex-col relative selection:bg-cyan-500/30">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>
            
            <div className="relative z-20 p-6 pb-4 flex flex-col gap-4 border-b border-cyan-500/10 backdrop-blur-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <button onClick={() => navigate(-1)} className="text-cyan-400 text-sm font-bold hover:text-cyan-300 transition-colors mb-2 flex items-center gap-2">
                            ← Back to System
                        </button>
                        <h1 
                            onDoubleClick={() => isAdmin && setIsDevMode(!isDevMode)}
                            className={`text-3xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all ${isDevMode ? 'from-amber-400 to-rose-600' : 'from-cyan-400 to-blue-600'} ${isAdmin ? 'cursor-pointer' : 'cursor-default select-none'}`}
                            title={isAdmin ? "Double click to toggle mapping tool" : ""}
                        >
                            Holographic Workbench {isDevMode && "(MAPPER MODE)"}
                        </h1>
                    </div>
                </div>
                
                {/* System Instructions Panel */}
                <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-4 flex items-start gap-3 w-full lg:w-2/3 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                    <span className="text-cyan-400 text-xl animate-pulse mt-0.5">⟁</span>
                    <div>
                        <h3 className="text-cyan-50 text-sm font-bold uppercase tracking-widest mb-1">System Instructions</h3>
                        <p className="text-cyan-200/70 text-xs leading-relaxed">
                            Interact with the highlighted components on the holographic projection to query the mainframe for compatible upgrades. Select a part from the live feed and engage the simulation to instantly project your new system's performance.
                        </p>
                        {isAdmin && (
                            <p className="text-amber-400/80 text-[10px] uppercase font-bold tracking-widest mt-2">
                                Admin Note: Double-click the main title above to enter Mapper Mode and re-draw component zones.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 relative z-10">
                
                <div className={`flex-1 relative rounded-3xl border shadow-[inset_0_0_100px_rgba(6,182,212,0.15)] overflow-hidden flex items-center justify-center bg-black transition-all ${isDevMode && drawingZone ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-cyan-500/20'}`}>
                    
                    <TransformWrapper
                        initialScale={1}
                        minScale={1}
                        maxScale={4}
                        centerOnInit={true}
                        disabled={!isDevMode || (isDevMode && drawingZone !== null)}
                        panning={{ disabled: !isDevMode || (isDevMode && drawingZone !== null) }}
                        wheel={{ step: 0.1, disabled: !isDevMode || (isDevMode && drawingZone !== null) }}
                        pinch={{ disabled: !isDevMode || (isDevMode && drawingZone !== null) }}
                        doubleClick={{ disabled: true }}
                    >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <React.Fragment>
                                
                                {isDevMode && (
                                    <div className="absolute top-4 right-4 z-50 flex gap-2 bg-black/60 p-2 rounded-xl backdrop-blur-md border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                                        <button onClick={() => zoomIn()} className="w-8 h-8 flex items-center justify-center bg-cyan-900/50 hover:bg-cyan-500/50 text-cyan-300 rounded-lg transition-colors font-bold text-xl">+</button>
                                        <button onClick={() => zoomOut()} className="w-8 h-8 flex items-center justify-center bg-cyan-900/50 hover:bg-cyan-500/50 text-cyan-300 rounded-lg transition-colors font-bold text-xl">-</button>
                                        <button onClick={() => resetTransform()} className="w-8 h-8 flex items-center justify-center bg-cyan-900/50 hover:bg-cyan-500/50 text-cyan-300 rounded-lg transition-colors" title="Reset View">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                        </button>
                                    </div>
                                )}

                                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                                    <div className={`relative inline-block max-w-full max-h-full ${isDevMode && drawingZone ? 'cursor-crosshair' : ''}`}>
                                        
                                        <img src="/clean-hologram.png" alt="Hologram PC" className="w-full h-auto object-contain max-h-[70vh] opacity-90 pointer-events-none" />
                                        
                                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full z-30" onClick={handleSvgClick}>
                                            {zones.map(zone => {
                                                const isSelected = selectedZone === zone.id;
                                                const isHovered = hoveredZone === zone.id;
                                                
                                                if (drawingZone === zone.id) return null;

                                                return (
                                                    <polygon 
                                                        key={zone.id}
                                                        points={zone.points}
                                                        className={`transition-all duration-300 pointer-events-auto cursor-pointer ${
                                                            isDevMode ? 'fill-amber-500/10 stroke-amber-500/50 stroke-[0.2]' : 
                                                            isSelected ? 'fill-cyan-500/40 stroke-white stroke-[0.3] drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 
                                                            isHovered ? 'fill-cyan-500/20 stroke-cyan-300 stroke-[0.2] drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 
                                                            'fill-transparent stroke-transparent'
                                                        }`}
                                                        onClick={() => !isDevMode && setSelectedZone(zone.id)}
                                                        onMouseEnter={() => !isDevMode && setHoveredZone(zone.id)}
                                                        onMouseLeave={() => !isDevMode && setHoveredZone(null)}
                                                    />
                                                );
                                            })}

                                            {isDevMode && drawingZone && currentPoints.length > 0 && (
                                                <>
                                                    <polyline points={currentPoints.map(p => `${p.x},${p.y}`).join(" ")} fill="rgba(251, 191, 36, 0.2)" stroke="#fbbf24" strokeWidth="0.3" strokeDasharray="0.5" />
                                                    {currentPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="0.6" fill="#fff" />)}
                                                </>
                                            )}
                                        </svg>

                                        {!isDevMode && zones.map(zone => {
                                            const center = getCenter(zone.points);
                                            const isSelected = selectedZone === zone.id;
                                            return (
                                                <div 
                                                    key={`label-${zone.id}`}
                                                    className={`absolute pointer-events-none transition-all duration-500 flex items-center gap-2 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                                                    style={{ top: center.top, left: center.left, zIndex: 40 }}
                                                >
                                                    <div className="w-6 h-px bg-cyan-400"></div>
                                                    <div className="bg-cyan-950/90 border border-cyan-500/50 backdrop-blur-md px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-cyan-50 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] whitespace-nowrap">
                                                        {zone.label}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TransformComponent>
                            </React.Fragment>
                        )}
                    </TransformWrapper>

                    {isDevMode && (
                        <div className="absolute bottom-6 left-6 bg-black/90 backdrop-blur-xl border border-amber-500/50 p-5 rounded-2xl z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-w-sm">
                            <h3 className="text-amber-400 font-bold uppercase mb-2 text-sm flex items-center gap-2">
                                <span>📐</span> Polygon Mapping Tool
                            </h3>
                            <p className="text-xs text-white/70 mb-4 leading-relaxed">
                                {drawingZone 
                                    ? `Click edges of the ${drawingZone.toUpperCase()} to draw its shape. Zooming is disabled while drawing.`
                                    : "Select a component to start drawing. You can zoom/pan to be precise!"}
                            </p>
                            
                            {drawingZone ? (
                                <div className="flex flex-col gap-3">
                                    <div className="text-[10px] text-amber-200 bg-amber-900/30 p-2 rounded font-mono">
                                        Points recorded: {currentPoints.length}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={savePolygon} className="flex-1 bg-emerald-600/50 hover:bg-emerald-500 border border-emerald-500 py-2 rounded text-xs font-bold transition-colors">Save Shape</button>
                                        <button onClick={() => { setDrawingZone(null); setCurrentPoints([]); }} className="flex-1 bg-rose-900/50 hover:bg-rose-600/50 border border-rose-500/30 py-2 rounded text-xs font-bold transition-colors">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {zones.map(z => (
                                        <button 
                                            key={`btn-${z.id}`}
                                            onClick={() => setDrawingZone(z.id)} 
                                            className="bg-cyan-900/50 hover:bg-cyan-600/50 border border-cyan-500/30 py-2 rounded text-[10px] uppercase font-bold transition-colors"
                                        >
                                            Draw {z.id}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {!drawingZone && (
                                <div className="mt-4 flex flex-col gap-2">
                                    <button 
                                        onClick={() => {
                                            const codeReadyZones = zones.map(z => ({ ...z, icon: z.icon }));
                                            navigator.clipboard.writeText(JSON.stringify(codeReadyZones, null, 2));
                                            alert("Polygons copied! Open VS Code and replace the 'zones' array with this text.");
                                        }}
                                        className="w-full bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/50 text-amber-300 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors"
                                    >
                                        Copy Final Config
                                    </button>
                                    <button 
                                        onClick={() => {
                                            localStorage.removeItem("hologramZones");
                                            window.location.reload();
                                        }}
                                        className="w-full text-[10px] text-rose-400/70 hover:text-rose-400 uppercase tracking-widest"
                                    >
                                        Clear Local Storage
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* HUD Data Panel */}
                <div className={`w-full lg:w-[450px] flex flex-col gap-4 transition-opacity duration-300 ${isDevMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                    <div className="bg-[#020617]/80 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-6 flex-1 flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.1)] relative overflow-hidden">
                        
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                        <div className="flex items-center justify-between mb-8 border-b border-cyan-500/20 pb-4">
                            <h2 className="text-xl font-black uppercase text-cyan-50 flex items-center gap-3">
                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_cyan]"></span>
                                {selectedZone} ANALYSIS
                            </h2>
                        </div>

                        {selectedZone === "ram" ? (
                            <div className="flex flex-col gap-6 flex-1 justify-center">
                                <div className="text-center"><span className="text-cyan-600 text-xs uppercase font-bold">Allocate Memory</span></div>
                                <div className="flex items-center justify-between bg-black/50 border border-cyan-500/30 rounded-2xl p-6">
                                    <button onClick={() => handleRamChange("down")} disabled={ramInput === ramSteps[0]} className="p-3 text-cyan-500 hover:text-cyan-300 disabled:opacity-20"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg></button>
                                    <div className="flex flex-col items-center">
                                        <span className="text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">{ramInput}</span>
                                        <span className="text-cyan-500/70 font-bold uppercase text-xs mt-1">GB DDR</span>
                                    </div>
                                    <button onClick={() => handleRamChange("up")} disabled={ramInput === ramSteps[ramSteps.length - 1]} className="p-3 text-cyan-500 hover:text-cyan-300 disabled:opacity-20"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg></button>
                                </div>
                            </div>
                        ) : isLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-cyan-400 gap-4">
                                <div className="w-10 h-10 border-[3px] border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
                            </div>
                        ) : recommendations?.length > 0 ? (
                            <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
                                {recommendations.map(rec => {
                                    const perc = rec.compatibility_percentage;
                                    const isError = typeof perc !== "number";
                                    const colorClass = isError ? 'text-amber-500' : perc >= 80 ? 'text-emerald-400' : perc >= 50 ? 'text-amber-400' : 'text-rose-500';
                                    const bgClass = isError ? 'bg-amber-500' : perc >= 80 ? 'bg-emerald-400' : perc >= 50 ? 'bg-amber-400' : 'bg-rose-500';

                                    return (
                                        <div 
                                            key={rec._id} 
                                            onClick={() => setSelectedUpgradeId(rec._id)}
                                            className={`p-4 rounded-xl cursor-pointer transition-all ${selectedUpgradeId === rec._id ? 'bg-cyan-950/60 border border-cyan-400' : 'bg-black/40 border border-cyan-500/10'}`}
                                        >
                                            <div className="flex justify-between items-start mb-3 gap-2">
                                                <span className="text-sm font-bold text-cyan-50">
                                                    {cleanHardwareName(`${rec.brand} ${rec.model}`)}
                                                </span>
                                                <span className="text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-1 rounded">{rec.benchmarkScore} Pts</span>
                                            </div>
                                            {(isError || rec.compatibility_reason) && (
                                                <div className="space-y-2 mt-3 pt-3 border-t border-cyan-500/10">
                                                    {!isError && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-1 bg-black rounded-full overflow-hidden">
                                                                <div className={`h-full ${bgClass}`} style={{width: `${perc}%`}}></div>
                                                            </div>
                                                            <span className={`text-xs font-bold ${colorClass}`}>{perc}% MATCH</span>
                                                        </div>
                                                    )}
                                                    <p className={`text-xs leading-relaxed uppercase ${isError ? colorClass : "text-cyan-600/80"}`}>{rec.compatibility_reason}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : null}

                        <button 
                            onClick={handleSimulate}
                            disabled={isLoading || (!selectedUpgradeId && selectedZone !== 'ram')}
                            className={`mt-4 w-full py-4 font-black rounded-xl uppercase tracking-widest transition-all duration-300 border ${
                                (selectedUpgradeId || selectedZone === 'ram') 
                                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-cyan-400 cursor-pointer' 
                                : 'bg-transparent text-cyan-800 border-cyan-900 cursor-not-allowed'
                            }`}
                        >
                            {isLoading ? 'INITIATING...' : (selectedUpgradeId || selectedZone === 'ram') ? 'ENGAGE SIMULATION' : 'AWAITING SELECTION'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}