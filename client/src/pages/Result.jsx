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
        <div className="bg-[#303
}