import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_CALL from "../api/API_CALL";
import useAuthStore from "../store/useAuthStore";

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

  // --- הפונקציה עודכנה כדי לתמוך בציון המספרי החדש ---
  const isGamePlayable = (gameData) => {
    if (!gameData) return false;
    if (gameData.overallScore !== undefined) {
      return gameData.overallScore >= 50; // אם הציון 50 ומעלה, המחשב עבר את המינימום
    }
    // תאימות לאחור במידה והשרת טרם התעדכן
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

        setData(result.data);
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
  }, [gameId, token, navigate]);

  useEffect(() => {
    if (data && !dealSearched && isGamePlayable(data)) {
      fetchGameDeal(data.gameTitle);
    }
  }, [data, dealSearched]);

  if (loading) {
    return (
      <div className="flex flex-col items-center pt-32 px-4 min-h-screen">
        <div className="w-16 h-16 border-4 border-[#8ab4f8] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl text-[#e8eaed]">Analyzing Specifications...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center pt-32 px-4 min-h-screen text-center">
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
  // חישובי תצוגה מבוססי אחוזים (לפי מה שהשרת מחזיר)
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
    // תאימות לאחור
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
  const strokeDashoffset =
    circumference - (overallPercent / 100) * circumference;

  // --- זיהוי צוואר בקבוק (Bottleneck) ---
  let bottleneck = null;
  if (data.componentScores && overallPercent < 100) {
    const scoresArray = [
      { name: "CPU", score: data.componentScores.cpu.score },
      { name: "GPU", score: data.componentScores.gpu.score },
      { name: "RAM", score: data.componentScores.ram.score },
    ];
    // מיין מהנמוך לגבוה, קח את החלש ביותר
    scoresArray.sort((a, b) => a.score - b.score);
    bottleneck = scoresArray[0].name;
  }

  // חישובי CheapShark
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

  // רשימת הרכיבים למעבר עליהם בלולאה
  const hardwareParts = [
    { id: "cpu", label: "CPU" },
    { id: "gpu", label: "GPU" },
    { id: "ram", label: "RAM" },
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
    <div className="flex flex-col items-center pt-16 sm:pt-24 px-4 min-h-screen pb-12">
      <h2 className="text-3xl sm:text-4xl text-[#e8eaed] mb-2 text-center font-medium">
        {data.gameTitle}
      </h2>
      <p className="text-[#9aa0a6] mb-12 text-lg">Performance Analysis</p>

      {/* Top: Large Circular Gauge */}
      <div className="relative flex flex-col items-center mb-8">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90 drop-shadow-xl">
            <circle
              cx="128"
              cy="128"
              r={radius}
              stroke="#303134"
              strokeWidth="16"
              fill="transparent"
            />
            <circle
              cx="128"
              cy="128"
              r={radius}
              stroke={overallColor}
              strokeWidth="16"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="text-center z-10 flex flex-col items-center mt-2">
            <span
              className="text-5xl sm:text-6xl font-bold"
              style={{ color: overallColor }}
            >
              {overallPercent}%
            </span>
            <p className="text-[#e8eaed] mt-3 font-medium text-lg tracking-wide">
              {overallText}
            </p>
          </div>
        </div>
      </div>

      {/* אזור ה-Deal של CheapShark */}
      {isGamePlayable(data) && (
        <div className="w-full max-w-lg mb-12">
          {dealLoading ? (
            <div className="bg-[#202124] rounded-xl p-5 border border-[#3c4043] flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-[#FBBC05] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[#9aa0a6] text-sm font-medium">
                🔍 Scanning stores for deals...
              </p>
            </div>
          ) : deal ? (
            <div className="bg-gradient-to-r from-[#1a1b1e] to-[#202124] p-1 rounded-2xl shadow-[0_0_20px_rgba(251,188,5,0.1)] hover:shadow-[0_0_25px_rgba(251,188,5,0.2)] transition-shadow">
              <div className="bg-[#202124] rounded-xl p-5 border border-[#FBBC05]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <span className="text-xs font-bold text-[#FBBC05] uppercase tracking-wider">
                      🔥 Best Deal
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-[#e8eaed]">
                      {storeName}
                    </span>
                  </div>
                  <div className="text-[#e8eaed] font-medium flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                    {isDiscounted && (
                      <span className="text-[#9aa0a6] line-through text-sm">
                        ${retailPrice.toFixed(2)}
                      </span>
                    )}
                    <span className="text-[#34A853] font-black text-2xl">
                      ${salePrice.toFixed(2)}
                    </span>
                    {isDiscounted && (
                      <span className="text-xs font-bold bg-[#34A853]/20 text-[#34A853] px-2 py-1 rounded">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={`https://www.cheapshark.com/redirect?dealID=${deal.cheapestDealID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#FBBC05] to-[#f9ab00] hover:from-[#f9ab00] hover:to-[#ea8600] text-[#202124] rounded-xl font-bold transition-transform hover:scale-105 shadow-md whitespace-nowrap shrink-0 flex items-center gap-2"
                >
                  Buy Now
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </a>
              </div>
            </div>
          ) : dealSearched ? (
            <div className="bg-[#202124] rounded-xl p-4 border border-[#3c4043] text-center">
              <span className="text-[#9aa0a6] text-sm">
                No active deals found across official stores right now.
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* =========================================
          Detailed Specs Cards (גרפים מפורטים)
      ========================================= */}
      <div className="bg-[#303134] border border-[#5f6368] rounded-2xl p-5 sm:p-8 w-full max-w-4xl shadow-xl mt-4">
        {/* אזהרת צוואר בקבוק אם קיים */}
        {bottleneck && (
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

        <h3 className="text-2xl text-[#e8eaed] mb-6 border-b border-[#5f6368] pb-4 font-medium">
          Detailed Hardware Analysis
        </h3>

        <div className="flex flex-col gap-6">
          {/* הרצת לולאה על 3 הרכיבים במקום לשכפל קוד */}
          {hardwareParts.map((part) => {
            const compData = data.components[part.id]; // המילה: optimal/okay/weak
            const scoreData = data.componentScores
              ? data.componentScores[part.id]
              : null;
            const details = data.specsDetails[part.id];

            // הגדרת משתני התקדמות
            const partPercent = scoreData
              ? scoreData.score
              : compData === "optimal"
                ? 100
                : compData === "okay"
                  ? 75
                  : 30;
            const partColor =
              partPercent >= 100
                ? "#34A853"
                : partPercent >= 50
                  ? "#FBBC05"
                  : "#EA4335";
            const partStatusText =
              partPercent >= 100
                ? "Meets Recommended"
                : partPercent >= 50
                  ? "Meets Minimum"
                  : "Below Minimum";

            return (
              <div
                key={part.id}
                className="flex flex-col bg-[#202124] p-4 sm:p-6 rounded-xl border border-[#3c4043] shadow-inner gap-4"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-[#3c4043] pb-3 gap-2 sm:gap-0">
                  <span className="text-xl text-[#e8eaed] font-bold">
                    {part.label}
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: partColor }}
                  >
                    {scoreData ? `${partPercent}% - ` : ""}
                    {partStatusText}
                  </span>
                </div>

                {/* בר ההתקדמות החדש! */}
                <div className="mt-2 mb-4">
                  <div className="relative w-full h-3 bg-[#1a1b1e] rounded-full overflow-hidden border border-[#3c4043]">
                    {/* המילוי שזז */}
                    <div
                      className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full"
                      style={{
                        width: `${partPercent}%`,
                        backgroundColor: partColor,
                      }}
                    ></div>
                    {/* קווים מנחים - מינימום ב-50%, מומלץ ב-99% */}
                    <div
                      className="absolute top-0 bottom-0 left-[50%] border-l-2 border-white/30 border-dashed"
                      title="Minimum Requirement"
                    ></div>
                    <div
                      className="absolute top-0 bottom-0 left-[99%] border-l-2 border-white/30 border-dashed"
                      title="Recommended Requirement"
                    ></div>
                  </div>
                  {/* טקסט מתחת לבר */}
                  <div className="relative w-full text-[10px] text-[#9aa0a6] font-bold uppercase tracking-wider h-4 mt-1">
                    <span className="absolute left-0">Weak</span>
                    <span className="absolute left-[50%] -translate-x-1/2">
                      Minimum
                    </span>
                    <span className="absolute right-0">Rec.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2">
                  <div className="flex flex-col">
                    <span className="text-[#9aa0a6] mb-1 font-medium">
                      Your {part.label}
                    </span>
                    <span className="text-[#8ab4f8] font-semibold">
                      {cleanHardwareName(details?.user)}
                    </span>{" "}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[#9aa0a6] mb-1 font-medium">
                      Minimum
                    </span>
                    <span className="text-[#e8eaed]">
                      {details?.min || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[#9aa0a6] mb-1 font-medium">
                      Recommended
                    </span>
                    <span className="text-[#e8eaed]">
                      {details?.rec || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row flex-wrap justify-center gap-4 w-full max-w-4xl">
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
  );
}
