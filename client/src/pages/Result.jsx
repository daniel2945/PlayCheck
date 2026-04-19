import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_CALL from "../api/API_CALL";
import useAuthStore from "../store/useAuthStore";
import ResultsDashboard from "../components/ResultsDashboard";

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

        // ✨ NEW: Explicitly fetch game details to get the image URL (since the check endpoint omits it)
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

        // Merge the explicitly fetched image into the analysis data state!
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
  }, [gameId, token, navigate]);

  useEffect(() => {
    if (data && !dealSearched && isGamePlayable(data)) {
      fetchGameDeal(data.gameTitle);
    }
  }, [data, dealSearched]);

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

  console.log("Dashboard Props:", data);

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

  // Grab the image we explicitly fetched and saved into the state
  const extractedUrl = data.gameImage;
  const fallbackImage =
    "https://placehold.co/600x400/1a1a1a/ffffff?text=No+Image";

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

      {/* Main Content Wrapper (Placed above the background layers) */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* GAME HEADER: Dynamic Ambient Underlay */}
        <div className="relative w-full max-w-5xl mb-12 h-auto sm:h-52 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] border border-white/10 overflow-hidden flex flex-col sm:flex-row z-10">
          {/* Layer 1: Dynamic Ambient Background */}
          <div
            className="absolute inset-0 bg-cover bg-center blur-3xl saturate-50 scale-110 z-0 opacity-80"
            style={{ backgroundImage: `url(${extractedUrl || fallbackImage})` }}
          ></div>

          {/* Layer 2: Subtle Vignette/Overlay */}
          <div className="absolute inset-0 bg-black/60 sm:bg-gradient-to-r sm:from-black/90 sm:via-black/60 sm:to-black/40 z-0"></div>

          {/* Layer 3: Content Wrapper */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-center w-full h-full p-6 gap-6 sm:gap-8">
            {/* Foreground Image - NO CROP */}
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

            {/* Text Content */}
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

        {/* =========================================
          1. Detailed Specs Cards (גרפים מפורטים)
      ========================================= */}
        <ResultsDashboard
          results={{
            cpuScore:
              data.componentScores?.cpu?.score ??
              (data.components?.cpu === "optimal"
                ? 100
                : data.components?.cpu === "okay"
                  ? 75
                  : 30),
            gpuScore:
              data.componentScores?.gpu?.score ??
              (data.components?.gpu === "optimal"
                ? 100
                : data.components?.gpu === "okay"
                  ? 75
                  : 30),
            ramScore:
              data.componentScores?.ram?.score ??
              (data.components?.ram === "optimal"
                ? 100
                : data.components?.ram === "okay"
                  ? 75
                  : 30),
            cpuUser: data.specsDetails?.cpu?.user || "",
            gpuUser: data.specsDetails?.gpu?.user || "",
            ramUser: data.specsDetails?.ram?.user || "",
            cpuReq: data.specsDetails?.cpu?.rec || "",
            gpuReq: data.specsDetails?.gpu?.rec || "",
            ramReq: data.specsDetails?.ram?.rec || "",
            overallScore: overallPercent,
          }}
        />

        {/* =========================================
          2. אזור ה-Deal של CheapShark
      ========================================= */}
        {isGamePlayable(data) && (
          <div className="w-full max-w-4xl mb-12">
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
          3. כפתורי פעולה
      ========================================= */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 w-full max-w-4xl">
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
  );
}
