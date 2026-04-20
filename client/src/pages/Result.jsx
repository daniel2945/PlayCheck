import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_CALL from "../api/API_CALL";
import useAuthStore from "../store/useAuthStore";
import HardwareInput from "../components/HardwareInput"; // הקומפוננטה שלך לסימולציה
// במידה ותרצה להשתמש ב-ResultsDashboard בעתיד, תצטרך להעביר אליו את הלוגיקה של הסימולציה.
// כרגע אנחנו משאירים את הקוד הפונקציונלי החכם שבנית ב-main.

// =========================================================================
// מילון חנויות של CheapShark
// =========================================================================
const STORE_NAMES = {
  1: "Steam",
  2: "GamersGate",
  3: "GreenManGaming",
  4: "Amazon",
  5: "GameStop",
  7: "GOG",
  8: "Origin",
  11: "Humble Store",
  13: "Uplay",
  15: "Fanatical",
  23: "WinGameStore",
  24: "GameBillet",
  25: "Epic Games",
  27: "Gamesplanet",
  28: "Gamesload",
  29: "2Game",
  30: "IndieGala",
  31: "Blizzard Shop",
  32: "AllYouPlay",
  33: "DLGamer",
  34: "Noctre",
  35: "DreamGame",
};

export default function Result() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deal, setDeal] = useState(null);
  const [dealLoading, setDealLoading] = useState(false);
  const [dealSearched, setDealSearched] = useState(false);

  // סטייטים לפיצ'ר עריכת סימולציה Inline
  const [editingPart, setEditingPart] = useState(null); // 'cpu', 'gpu', or 'ram'
  const [hardwareList, setHardwareList] = useState({ cpus: [], gpus: [] });
  const [testSpecs, setTestSpecs] = useState({ cpuId: "", gpuId: "", ramGb: 16 });
  const [isSimulating, setIsSimulating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isGamePlayable = (gameData) => {
    if (!gameData) return false;
    if (gameData.overallScore !== undefined) {
      return gameData.overallScore >= 50;
    }
    return gameData.overall?.toLowerCase() !== "weak";
  };

  const validateDeal = (ourTitle, dealTitle) => {
    const clean = (t) =>
      t
        .toLowerCase()
        .replace(
          /edition|director's cut|remastered|goty|game of the year/gi,
          "",
        )
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const ours = clean(ourTitle);
    const theirs = clean(dealTitle);

    if (ours === theirs) return true;

    const ourWords = ours.split(" ");
    const theirWords = theirs.split(" ");

    const extractNumbers = (words) => words.filter((w) => !isNaN(w)).join("");
    if (extractNumbers(ourWords) !== extractNumbers(theirWords)) return false;

    const allOursInTheirs = ourWords.every((w) => theirWords.includes(w));
    const allTheirsInOurs = theirWords.every((w) => ourWords.includes(w));

    return allOursInTheirs || allTheirsInOurs;
  };

  const fetchGameDeal = async (gameTitle) => {
    setDealLoading(true);
    setDealSearched(false);

    try {
      let cleanTitle = gameTitle
        .replace(/Edition|Director's Cut|Remastered|GOTY/gi, "")
        .replace(/[^a-zA-Z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const res = await fetch(
        `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(cleanTitle)}&limit=10`,
      );
      const dealData = await res.json();

      if (dealData && dealData.length > 0) {
        const validMatch = dealData.find((d) =>
          validateDeal(gameTitle, d.external),
        );
        if (validMatch) {
          const specificDealRes = await fetch(
            `https://www.cheapshark.com/api/1.0/deals?id=${validMatch.cheapestDealID}`,
          );
          const specificDealData = await specificDealRes.json();

          setDeal({
            ...validMatch,
            storeID: specificDealData.gameInfo.storeID,
            retailPrice: specificDealData.gameInfo.retailPrice,
            salePrice: specificDealData.gameInfo.salePrice,
          });
        } else {
          setDeal(null);
        }
      } else {
        setDeal(null);
      }
    } catch (err) {
      console.error("Failed to fetch deal from CheapShark:", err);
    } finally {
      setDealLoading(false);
      setDealSearched(true);
    }
  };

  useEffect(() => {
    if (!gameId) {
      navigate("/catalog");
      return;
    }

    const fetchCompatibility = async () => {
      setLoading(true);
      setError("");

      try {
        let result;
        if (token) {
          result = await API_CALL(`/api/game/user/check/${gameId}`);
        } else {
          const guestSpecs = JSON.parse(localStorage.getItem("guestSpecs"));
          if (!guestSpecs || !guestSpecs.cpu?._id || !guestSpecs.gpu?._id) {
            setError("No valid PC specs found. Please set up your PC first.");
            setLoading(false);
            return;
          }
          result = await API_CALL(`/api/game/guest/check/${gameId}`, "POST", {
            myPc: {
              cpuId: guestSpecs.cpu._id,
              gpuId: guestSpecs.gpu._id,
              ramGb: guestSpecs.ram || 16,
            },
          });
        }

        // Fetch explicitly to get image for the new design header
        let fetchedImage = "";
        try {
          const gameRes = await API_CALL(`/api/game/search/${gameId}`);
          if (gameRes.success && gameRes.data) {
            fetchedImage =
              gameRes.data.background_image || gameRes.data.image || "";
          }
        } catch (imgErr) {
          console.warn("Failed to fetch game image details:", imgErr);
        }

        setData({ ...result.data, gameImage: fetchedImage });
      } catch (err) {
        console.error("Analysis Error:", err);
        setError(
          err.message ||
            "A network error occurred. Please check if the server is running.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompatibility();
  }, [gameId, token, navigate, refreshTrigger]);

  useEffect(() => {
    if (data && !dealSearched && isGamePlayable(data)) {
      fetchGameDeal(data.gameTitle);
    }
  }, [data, dealSearched]);

  const cleanHardwareName = (name) => {
    if (!name) return "N/A";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
      return parts.slice(1).join(" ");
    }
    return name;
  };

  const openEditMode = async (partId) => {
    if (hardwareList.cpus.length === 0) {
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

          setTestSpecs({
            cpuId: testSpecs.cpuId || matchedCpu?._id || "",
            gpuId: testSpecs.gpuId || matchedGpu?._id || "",
            ramGb: testSpecs.ramGb || matchedRam
          });
        }
      } catch (err) {
        console.error("Failed to load hardware list", err);
      }
    }
    setEditingPart(partId);
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
        myPc: {
          cpuId: testSpecs.cpuId,
          gpuId: testSpecs.gpuId,
          ramGb: Number(testSpecs.ramGb),
        },
      });
      setData(result.data);
      setIsSimulating(true);
    } catch (err) {
      setError(err.message || "Simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setEditingPart(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center pt-32 px-4 min-h-screen bg-[#050505]">
        <div className="w-16 h-16 border-4 border-[#8ab4f8] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl text-[#e8eaed]">Analyzing Specifications...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center pt-32 px-4 min-h-screen text-center bg-[#050505]">
        <div className="bg-[#303134] border border-[#EA4335] text-[#EA4335] p-6 rounded-xl max-w-lg mb-8 shadow-lg">
          <p className="text-lg font-medium">{error}</p>
        </div>
        <button
          onClick={() => navigate("/setup")}
          className="px-8 py-3 bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa] rounded-full font-bold transition-colors"
        >
          Setup PC Specs
        </button>
      </div>
    );
  }

  if (!data) return null;

  // =========================================================================
  // חישובים לתצוגה וצוואר בקבוק
  // =========================================================================
  let overallPercent = 0;
  let overallColor = "#9aa0a6";
  let overallText = "Unknown";

  if (data.overallScore !== undefined) {
    overallPercent = data.overallScore;
    if (overallPercent < 50) {
      overallColor = "#EA4335";
      overallText = "Does Not Meet Minimum";
    } else if (overallPercent < 100) {
      overallColor = "#FBBC05";
      overallText = "Minimum Specs Met";
    } else {
      overallColor = "#34A853";
      overallText = "Optimal Performance";
    }
  } else {
    const grade = data.overall?.toLowerCase();
    if (grade === "optimal") {
      overallPercent = 100;
      overallColor = "#34A853";
      overallText = "You Can Run It!";
    } else if (grade === "okay") {
      overallPercent = 85;
      overallColor = "#FBBC05";
      overallText = "You Can Run It!";
    } else {
      overallPercent = 30;
      overallColor = "#EA4335";
      overallText = "Does Not Meet Minimum";
    }
  }

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallPercent / 100) * circumference;

  let bottleneck = null;
  if (data.componentScores && overallPercent < 100) {
    const scoresArray = [
      { name: "CPU", score: data.componentScores.cpu.score },
      { name: "GPU", score: data.componentScores.gpu.score },
      { name: "RAM", score: data.componentScores.ram.score },
    ];
    scoresArray.sort((a, b) => a.score - b.score);
    bottleneck = scoresArray[0].name;
  }

  // חישובי מחירים
  let storeName = "Official Store";
  let isDiscounted = false;
  let discountPercent = 0;
  let retailPrice = 0;
  let salePrice = 0;

  if (deal) {
    storeName = STORE_NAMES[deal.storeID] || "Official Store";
    salePrice = parseFloat(deal.salePrice || deal.cheapest);
    retailPrice = parseFloat(deal.retailPrice || deal.cheapest);
    isDiscounted = retailPrice > salePrice;
    if (isDiscounted) {
      discountPercent = Math.round((1 - salePrice / retailPrice) * 100);
    }
  }

  const hardwareParts = [
    { id: "cpu", label: "CPU" },
    { id: "gpu", label: "GPU" },
    { id: "ram", label: "RAM" },
  ];

  const extractedUrl = data.gameImage;
  const fallbackImage = "https://placehold.co/600x400/1a1a1a/ffffff?text=No+Image";

  return (
    <div
      className="relative flex flex-col items-center pt-16 sm:pt-24 px-4 pb-12 overflow-hidden min-h-screen w-full bg-[#050505]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        backgroundPosition: "center",
      }}
    >
      {/* Vignette / Global Radial Gradient Fade */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] pointer-events-none"></div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* GAME HEADER מענף העיצוב */}
        <div className="relative w-full max-w-5xl mb-12 h-auto sm:h-52 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] border border-white/10 overflow-hidden flex flex-col sm:flex-row z-10">
          <div
            className="absolute inset-0 bg-cover bg-center blur-3xl saturate-50 scale-110 z-0 opacity-80"
            style={{ backgroundImage: `url(${extractedUrl || fallbackImage})` }}
          ></div>
          <div className="absolute inset-0 bg-black/60 sm:bg-gradient-to-r sm:from-black/90 sm:via-black/60 sm:to-black/40 z-0"></div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-center w-full h-full p-6 gap-6 sm:gap-8">
            <div className="h-48 sm:h-full w-full sm:w-auto shrink-0 flex items-center justify-center">
              <img
                src={extractedUrl || fallbackImage}
                alt={data.gameTitle}
                className="h-full w-auto object-contain rounded-lg drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                onError={(e) => {
                  e.target.src = fallbackImage;
                }}
              />
            </div>

            <div className="flex flex-col text-center sm:text-left justify-center flex-1 py-2 sm:py-0">
              <h2 className="text-4xl sm:text-6xl text-white mb-2 font-extrabold tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] line-clamp-2">
                {data.gameTitle}
              </h2>
              <p className="text-[#8ab4f8] text-sm sm:text-xl font-bold tracking-[0.2em] uppercase opacity-90 drop-shadow-md">
                Performance Analysis
              </p>
            </div>
          </div>
        </div>

        {/* תוכן העמוד - סימולציה וחומרה מענף ה-main */}
        <div className="w-full max-w-5xl flex flex-col items-center">
          
          <div className="bg-[#303134] border border-[#5f6368] rounded-2xl p-5 sm:p-8 w-full shadow-xl mb-8 relative z-10">
            
            <div className="w-full bg-[#8ab4f8]/10 border border-[#8ab4f8]/30 rounded-xl p-4 mb-8 flex items-start sm:items-center gap-4 shadow-sm">
              <span className="text-2xl drop-shadow-md">💡</span>
              <div className="flex-1">
                <h4 className="text-[#8ab4f8] font-bold text-sm sm:text-base">Hardware Simulator</h4>
                <p className="text-[#9aa0a6] text-xs sm:text-sm mt-1 leading-relaxed">
                  Curious if an upgrade will help you run this game better? Click the <strong className="text-[#e8eaed]">⚙️ settings icon</strong> on any component below to swap it out and instantly simulate your new performance score.
                </p>
              </div>
              {isSimulating && (
                <button
                  onClick={resetSimulation}
                  className="px-4 py-2 bg-[#EA4335] text-white text-xs font-bold rounded-lg hover:bg-[#c5221f] transition-colors whitespace-nowrap shadow"
                >
                  Reset to My PC
                </button>
              )}
            </div>

            {bottleneck && !isSimulating && (
              <div className="w-full bg-gradient-to-r from-[#EA4335]/20 to-[#202124] border border-[#EA4335]/50 p-4 rounded-xl mb-8 flex items-start sm:items-center gap-4">
                <span className="text-2xl mt-1 sm:mt-0">⚠️</span>
                <div>
                  <h4 className="text-[#EA4335] font-bold">
                    Performance Bottleneck Detected
                  </h4>
                  <p className="text-[#e8eaed] text-sm">
                    Your{" "}
                    <span className="font-bold text-white bg-white/10 px-1 rounded">
                      {bottleneck}
                    </span>{" "}
                    is the weakest link holding back performance.
                  </p>
                </div>
              </div>
            )}

            <h3 className="text-2xl text-[#e8eaed] mb-6 border-b border-[#5f6368] pb-4 font-medium flex items-center gap-3">
              Detailed Hardware Breakdown
              {isSimulating && (
                <span className="text-[10px] bg-[#FBBC05] text-[#202124] px-2 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">
                  Simulated
                </span>
              )}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hardwareParts.map((part) => {
                const compData = data.components[part.id];
                const scoreData = data.componentScores ? data.componentScores[part.id] : null;
                const details = data.specsDetails[part.id];

                const partPercent = scoreData ? scoreData.score : compData === "optimal" ? 100 : compData === "okay" ? 75 : 30;
                const partColor = partPercent >= 100 ? "#34A853" : partPercent >= 50 ? "#FBBC05" : "#EA4335";
                const partStatusText = partPercent >= 100 ? "Meets Recommended" : partPercent >= 50 ? "Meets Minimum" : "Below Minimum";

                const smallRadius = 40;
                const smallCircumference = 2 * Math.PI * smallRadius;
                const smallStrokeDashoffset = smallCircumference - (Math.min(partPercent, 100) / 100) * smallCircumference;

                return (
                  <div
                    key={part.id}
                    className="flex flex-col items-center bg-[#202124] p-6 rounded-2xl border border-[#3c4043] shadow-lg hover:border-[#5f6368] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all group relative overflow-hidden"
                  >
                    <div
                      className="absolute top-0 left-0 w-full h-1"
                      style={{ backgroundColor: partColor }}
                    ></div>

                    <button
                      onClick={() => editingPart === part.id ? setEditingPart(null) : openEditMode(part.id)}
                      className={`absolute top-4 right-4 p-1.5 rounded-lg border transition-all z-20 ${
                        editingPart === part.id 
                          ? "bg-[#8ab4f8]/20 text-[#8ab4f8] border-[#8ab4f8]" 
                          : "bg-[#303134] text-[#9aa0a6] border-[#5f6368] hover:text-[#e8eaed] hover:border-[#9aa0a6]"
                      }`}
                      title={`Simulate different ${part.label}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    </button>

                    <h4 className="text-xl text-[#e8eaed] font-bold mb-4">
                      {part.label}
                    </h4>

                    <div className="relative w-28 h-28 mb-4 flex items-center justify-center">
                      <svg
                        className="absolute top-0 left-0 w-full h-full transform -rotate-90 transition-all duration-500"
                        style={{ filter: `drop-shadow(0 0 10px ${partColor}40)` }}
                      >
                        <circle cx="56" cy="56" r={smallRadius} stroke="#303134" strokeWidth="8" fill="transparent" />
                        <circle
                          cx="56" cy="56" r={smallRadius} stroke={partColor} strokeWidth="8" fill="transparent"
                          strokeDasharray={smallCircumference} strokeDashoffset={smallStrokeDashoffset} strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <span className="text-2xl font-bold z-10" style={{ color: partColor }}>
                        {partPercent}%
                      </span>
                    </div>

                    <span
                      className="text-[11px] font-bold uppercase tracking-wider mb-6 px-3 py-1 rounded-full bg-[#1a1b1e] border"
                      style={{ borderColor: `${partColor}50`, color: partColor }}
                    >
                      {partStatusText}
                    </span>

                    {editingPart === part.id ? (
                      <div className="w-full flex flex-col gap-3 text-sm text-left bg-[#1a1b1e] p-4 rounded-xl border border-[#8ab4f8] shadow-[0_0_15px_rgba(138,180,248,0.15)] animate-in fade-in duration-200">
                        <span className="text-[#8ab4f8] font-bold uppercase tracking-wider text-[11px]">
                          Test different {part.label}
                        </span>
                        
                        {part.id === 'ram' ? (
                          <input
                            type="number"
                            min="4"
                            max="128"
                            value={testSpecs.ramGb}
                            onChange={(e) => setTestSpecs({ ...testSpecs, ramGb: e.target.value })}
                            className="w-full p-2.5 rounded bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none focus:border-[#8ab4f8] transition-colors"
                          />
                        ) : (
                          <div className="mt-1">
                            <HardwareInput
                              type={part.label}
                              placeholder={`Search ${part.label}...`}
                              onSelect={(item) => {
                                setTestSpecs({ ...testSpecs, [`${part.id}Id`]: item ? item._id : "" });
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setEditingPart(null)} className="text-[#9aa0a6] hover:text-[#e8eaed] px-3 py-1.5 rounded transition-colors">
                            Cancel
                          </button>
                          <button 
                            onClick={handleTestSubmit} 
                            disabled={part.id === 'ram' ? !testSpecs.ramGb : !testSpecs[`${part.id}Id`]}
                            className="bg-[#8ab4f8] text-[#202124] font-bold px-4 py-1.5 rounded hover:bg-[#aecbfa] transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Simulate
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col gap-2 text-sm text-left bg-[#1a1b1e] p-4 rounded-xl border border-[#3c4043]">
                        <div className="flex flex-col border-b border-[#3c4043] pb-2">
                          <span className="text-[#9aa0a6] text-[11px] font-bold mb-1 uppercase tracking-wider">
                            {isSimulating ? `Simulated ${part.label}` : `Your ${part.label}`}
                          </span>
                          <span className="text-[#8ab4f8] font-bold truncate" title={cleanHardwareName(details?.user)}>
                            {cleanHardwareName(details?.user)}
                          </span>
                        </div>
                        <div className="flex flex-col border-b border-[#3c4043] pb-2">
                          <span className="text-[#9aa0a6] text-[11px] font-bold mb-1 uppercase tracking-wider">Minimum</span>
                          <span className="text-[#e8eaed] truncate" title={details?.min}>{details?.min || "N/A"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#9aa0a6] text-[11px] font-bold mb-1 uppercase tracking-wider">Recommended</span>
                          <span className="text-[#e8eaed] truncate" title={details?.rec}>{details?.rec || "N/A"}</span>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#303134] border border-[#5f6368] rounded-2xl p-5 sm:p-8 w-full shadow-xl mb-8 flex flex-col items-center relative z-10">
            <h3 className="text-2xl text-[#e8eaed] mb-8 border-b border-[#5f6368] pb-4 font-medium w-full text-left">
              Final Compatibility Verdict
            </h3>
            <div className="relative flex flex-col items-center mb-4">
              <div className="relative w-64 h-64 flex items-center justify-center">
                <svg
                  className="absolute top-0 left-0 w-full h-full transform -rotate-90 drop-shadow-xl transition-all duration-500"
                  style={{ filter: `drop-shadow(0 0 25px ${overallColor}40)` }}
                >
                  <circle cx="128" cy="128" r={radius} stroke="#202124" strokeWidth="16" fill="transparent" />
                  <circle
                    cx="128" cy="128" r={radius} stroke={overallColor} strokeWidth="16" fill="transparent"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="text-center z-10 flex flex-col items-center mt-2">
                  <span className="text-5xl sm:text-6xl font-bold" style={{ color: overallColor }}>
                    {overallPercent}%
                  </span>
                  <p className="text-[#e8eaed] mt-3 font-medium text-lg tracking-wide">
                    {overallText}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isGamePlayable(data) && (
            <div className="w-full mb-12 relative z-10">
              {dealLoading ? (
                <div className="bg-[#202124] rounded-xl p-5 border border-[#3c4043] flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-[#FBBC05] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[#9aa0a6] text-sm font-medium">🔍 Scanning stores for deals...</p>
                </div>
              ) : deal ? (
                <div className="bg-gradient-to-r from-[#1a1b1e] to-[#202124] p-1 rounded-2xl shadow-[0_0_20px_rgba(251,188,5,0.1)] hover:shadow-[0_0_25px_rgba(251,188,5,0.2)] transition-shadow">
                  <div className="bg-[#202124] rounded-xl p-5 border border-[#FBBC05]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left flex-1 min-w-0">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <span className="text-xs font-bold text-[#FBBC05] uppercase tracking-wider">🔥 Best Deal</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-[#e8eaed]">{storeName}</span>
                      </div>
                      <div className="text-[#e8eaed] font-medium flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                        {isDiscounted && <span className="text-[#9aa0a6] line-through text-sm">${retailPrice.toFixed(2)}</span>}
                        <span className="text-[#34A853] font-black text-2xl">${salePrice.toFixed(2)}</span>
                        {isDiscounted && <span className="text-xs font-bold bg-[#34A853]/20 text-[#34A853] px-2 py-1 rounded">-{discountPercent}%</span>}
                      </div>
                    </div>
                    <a href={`https://www.cheapshark.com/redirect?dealID=${deal.cheapestDealID}`} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-gradient-to-r from-[#FBBC05] to-[#f9ab00] hover:from-[#f9ab00] hover:to-[#ea8600] text-[#202124] rounded-xl font-bold transition-transform hover:scale-105 shadow-md whitespace-nowrap shrink-0 flex items-center gap-2">
                      Buy Now
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                    </a>
                  </div>
                </div>
              ) : dealSearched ? (
                <div className="bg-[#202124] rounded-xl p-4 border border-[#3c4043] text-center">
                  <span className="text-[#9aa0a6] text-sm">No active deals found across official stores right now.</span>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 w-full relative z-10">
            <button
              onClick={() => navigate(`/details/${gameId}`)}
              className="px-8 py-3 border border-[#8ab4f8] text-[#8ab4f8] hover:bg-[#8ab4f8] hover:text-[#202124] rounded-full font-bold transition-all"
            >
              View Full Game Details
            </button>
            <button
              onClick={() => navigate("/catalog")}
              className="px-8 py-3 border border-[#5f6368] text-[#e8eaed] hover:bg-[#3c4043] rounded-full font-medium transition-colors"
            >
              Check Another Game
            </button>
            <button
              onClick={() => navigate("/setup")}
              className="px-8 py-3 bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa] rounded-full font-bold transition-colors"
            >
              Change Specs
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
