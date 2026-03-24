import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import API_CALL from "../api/API_CALL"; 
import useAuthStore from "../store/useAuthStore";

export default function Result() {
  const { gameId } = useParams(); 
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setError(err.message || "A network error occurred. Please check if the server is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompatibility();
  }, [gameId, token, navigate]); 

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

  const getOverallStyle = (grade) => {
    if (grade === "optimal") return { percent: 100, color: "#34A853", text: "You Can Run It!" };
    if (grade === "okay") return { percent: 85, color: "#34A853", text: "You Can Run It!" };
    if (grade === "weak") return { percent: 30, color: "#EA4335", text: "Does Not Meet Minimum" };
    return { percent: 0, color: "#9aa0a6", text: "Unknown" };
  };

  const getComponentStyle = (grade) => {
    if (grade === "optimal") return { color: "#34A853", text: "Meets Requirements" };
    if (grade === "okay") return { color: "#FBBC05", text: "Minimum Specs" };
    if (grade === "weak") return { color: "#EA4335", text: "Does Not Meet" };
    return { color: "#9aa0a6", text: "Unknown" };
  };

  const overall = getOverallStyle(data.overall);

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overall.percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center pt-24 px-4 min-h-screen pb-12">
      <h2 className="text-4xl text-[#e8eaed] mb-2 text-center font-medium">
        {data.gameTitle}
      </h2>
      <p className="text-[#9aa0a6] mb-12 text-lg">Performance Analysis</p>

      {/* Top: Large Circular Gauge */}
      <div className="relative flex flex-col items-center mb-16">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90 drop-shadow-xl">
            <circle cx="128" cy="128" r={radius} stroke="#303134" strokeWidth="16" fill="transparent" />
            <circle
              cx="128"
              cy="128"
              r={radius}
              stroke={overall.color}
              strokeWidth="16"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="text-center z-10 flex flex-col items-center mt-2">
            <span className="text-6xl font-bold" style={{ color: overall.color }}>
              {overall.percent}%
            </span>
            <p className="text-[#e8eaed] mt-3 font-medium text-lg tracking-wide">
              {overall.text}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom: Distinct Card for Specs */}
      <div className="bg-[#303134] border border-[#5f6368] rounded-2xl p-8 w-full max-w-4xl shadow-xl">
        <h3 className="text-2xl text-[#e8eaed] mb-6 border-b border-[#5f6368] pb-4 font-medium">
          Your Specs vs Required
        </h3>
        <div className="flex flex-col gap-6">
          
          {/* CPU Row */}
          <div className="flex flex-col bg-[#202124] p-5 rounded-xl border border-[#3c4043] shadow-inner gap-4">
            <div className="flex justify-between items-center border-b border-[#3c4043] pb-3">
              <span className="text-xl text-[#e8eaed] font-bold">CPU</span>
              <span className="text-lg font-bold" style={{ color: getComponentStyle(data.components.cpu).color }}>
                {getComponentStyle(data.components.cpu).text}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">Your CPU</span>
                <span className="text-[#8ab4f8] font-semibold">{data.specsDetails?.cpu?.user || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">Minimum</span>
                <span className="text-[#e8eaed]">{data.specsDetails?.cpu?.min || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">Recommended</span>
                <span className="text-[#e8eaed]">{data.specsDetails?.cpu?.rec || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* GPU Row */}
          <div className="flex flex-col bg-[#202124] p-5 rounded-xl border border-[#3c4043] shadow-inner gap-4">
            <div className="flex justify-between items-center border-b border-[#3c4043] pb-3">
              <span className="text-xl text-[#e8eaed] font-bold">GPU</span>
              <span className="text-lg font-bold" style={{ color: getComponentStyle(data.components.gpu).color }}>
                {getComponentStyle(data.components.gpu).text}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">Your GPU</span>
                <span className="text-[#8ab4f8] font-semibold">{data.specsDetails?.gpu?.user || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">Minimum</span>
                <span className="text-[#e8eaed]">{data.specsDetails?.gpu?.min || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">Recommended</span>
                <span className="text-[#e8eaed]">{data.specsDetails?.gpu?.rec || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* RAM Row */}
          <div className="flex flex-col bg-[#202124] p-5 rounded-xl border border-[#3c4043] shadow-inner gap-4">
            <div className="flex justify-between items-center border-b border-[#3c4043] pb-3">
              <span className="text-xl text-[#e8eaed] font-bold">RAM</span>
              <span className="text-lg font-bold" style={{ color: getComponentStyle(data.components.ram).color }}>
                {getComponentStyle(data.components.ram).text}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">Your RAM</span>
                <span className="text-[#8ab4f8] font-semibold">{data.specsDetails?.ram?.user || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">Minimum</span>
                <span className="text-[#e8eaed]">{data.specsDetails?.ram?.min || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">Recommended</span>
                <span className="text-[#e8eaed]">{data.specsDetails?.ram?.rec || "N/A"}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Action Buttons - כאן התווסף הכפתור השלישי */}
      <div className="mt-12 flex flex-col sm:flex-row flex-wrap justify-center gap-4 w-full max-w-4xl">
        
        {/* כפתור למעבר לעמוד המשחק המלא */}
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