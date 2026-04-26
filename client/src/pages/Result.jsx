import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_CALL from "../api/API_CALL";
import useAuthStore from "../store/useAuthStore";

import GameHeader from "../components/Result/GameHeader";
import ResultsDashboard from "../components/Result/ResultsDashboard";
import DealBanner from "../components/Result/DealBanner";

export default function Result() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isSimulating, setIsSimulating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isGamePlayable = (gameData) => {
    if (!gameData) return false;
    if (gameData.overallScore !== undefined) return gameData.overallScore >= 50;
    return gameData.overall?.toLowerCase() !== "weak";
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
        let checkPromise;
        if (token) {
          checkPromise = API_CALL(`/api/game/user/check/${gameId}`);
        } else {
          const guestSpecs = JSON.parse(localStorage.getItem("guestSpecs"));
          if (!guestSpecs || !guestSpecs.cpu?._id || !guestSpecs.gpu?._id) {
            setError("No valid PC specs found. Please set up your PC first.");
            setLoading(false);
            return;
          }
          checkPromise = API_CALL(`/api/game/guest/check/${gameId}`, "POST", {
            myPc: {
              cpuId: guestSpecs.cpu._id,
              gpuId: guestSpecs.gpu._id,
              ramGb: guestSpecs.ram || 16,
            },
          });
        }

        const imagePromise = API_CALL(`/api/game/search/${gameId}`).catch(imgErr => {
          console.warn("Failed to fetch game image:", imgErr);
          return { success: false };
        });

        const [result, gameRes] = await Promise.all([checkPromise, imagePromise]);

        let fetchedImage = "";
        if (gameRes && gameRes.success && gameRes.data) {
          fetchedImage = gameRes.data.background_image || gameRes.data.image || "";
        }

        setData({ ...result.data, gameImage: fetchedImage });
      } catch (err) {
        console.error("Analysis Error:", err);
        setError(err.message || "A network error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompatibility();
  }, [gameId, token, navigate, refreshTrigger]);

  const resetSimulation = () => {
    setIsSimulating(false);
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
        <button onClick={() => navigate("/setup")} className="px-8 py-3 bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa] rounded-full font-bold transition-colors">
          Setup PC Specs
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className="relative flex flex-col items-center pt-16 sm:pt-24 px-4 pb-12 overflow-hidden min-h-screen w-full bg-[#050505]"
      style={{
        backgroundImage: "linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)",
        backgroundSize: "60px 60px", backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] pointer-events-none"></div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <GameHeader gameTitle={data.gameTitle} gameImage={data.gameImage} />

        <ResultsDashboard 
          data={data}
          setData={setData}
          gameId={gameId}
          setLoading={setLoading}
          setError={setError}
          isSimulating={isSimulating}
          setIsSimulating={setIsSimulating}
          resetSimulation={resetSimulation}
        />

        {isGamePlayable(data) && <DealBanner gameTitle={data.gameTitle} />}

        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 w-full relative z-10">
          <button onClick={() => navigate(`/details/${gameId}`)} className="px-8 py-3 border border-[#8ab4f8] text-[#8ab4f8] hover:bg-[#8ab4f8] hover:text-[#202124] rounded-full font-bold transition-all">
            View Full Game Details
          </button>
          <button onClick={() => navigate("/catalog")} className="px-8 py-3 border border-[#5f6368] text-[#e8eaed] hover:bg-[#3c4043] rounded-full font-medium transition-colors">
            Check Another Game
          </button>
          <button onClick={() => navigate("/setup")} className="px-8 py-3 bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa] rounded-full font-bold transition-colors">
            Change Specs
          </button>
        </div>
      </div>
    </div>
  );
}