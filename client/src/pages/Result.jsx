import { useState, useEffect } from "react";

export default function Result({ setView, selectedGameId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Bounce back if accessed directly without selecting a game
    if (!selectedGameId) {
      setView("games");
      return;
    }

    const fetchCompatibility = async () => {
      setLoading(true);
      setError("");

      try {
        let res;
        if (token) {
          // AUTHENTICATED USER FLOW
          res = await fetch(
            `http://localhost:3000/api/game/user/check/${selectedGameId}`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            },
          );
        } else {
          // GUEST FLOW
          const guestSpecs = JSON.parse(localStorage.getItem("guestSpecs"));
          if (!guestSpecs || !guestSpecs.cpu?._id || !guestSpecs.gpu?._id) {
            setError("No valid PC specs found. Please set up your PC first.");
            setLoading(false);
            return;
          }
          res = await fetch(
            `http://localhost:3000/api/game/guest/check/${selectedGameId}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                myPc: {
                  cpuId: guestSpecs.cpu._id,
                  gpuId: guestSpecs.gpu._id,
                  ramGb: guestSpecs.ram || 16,
                },
              }),
            },
          );
        }

        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(
            result.data || result.message || "Failed to fetch compatibility.",
          );
        }
      } catch (err) {
        console.error("Analysis Error:", err);
        setError(
          "A network error occurred. Please check if the server is running.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompatibility();
  }, [selectedGameId, token, setView]);

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
          onClick={() => setView("pc-setup")}
          className="px-8 py-3 bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa] rounded-full font-bold transition-colors"
        >
          Setup PC Specs
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Style Mappers based on backend grades ("optimal", "okay", "weak")
  const getOverallStyle = (grade) => {
    if (grade === "optimal")
      return { percent: 100, color: "#34A853", text: "You Can Run It!" };
    if (grade === "okay")
      return { percent: 85, color: "#34A853", text: "You Can Run It!" };
    if (grade === "weak")
      return { percent: 30, color: "#EA4335", text: "Does Not Meet Minimum" };
    return { percent: 0, color: "#9aa0a6", text: "Unknown" };
  };

  const getComponentStyle = (grade) => {
    if (grade === "optimal")
      return { color: "#34A853", text: "Meets Requirements" };
    if (grade === "okay") return { color: "#FBBC05", text: "Minimum Specs" };
    if (grade === "weak") return { color: "#EA4335", text: "Does Not Meet" };
    return { color: "#9aa0a6", text: "Unknown" };
  };

  const overall = getOverallStyle(data.overall);

  // SVG Gauge Calculations
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (overall.percent / 100) * circumference;

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
            <span
              className="text-6xl font-bold"
              style={{ color: overall.color }}
            >
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
              <span
                className="text-lg font-bold"
                style={{ color: getComponentStyle(data.components.cpu).color }}
              >
                {getComponentStyle(data.components.cpu).text}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">
                  Your CPU
                </span>
                <span className="text-[#8ab4f8] font-semibold">
                  {data.specsDetails?.cpu?.user || "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">Minimum</span>
                <span className="text-[#e8eaed]">
                  {data.specsDetails?.cpu?.min || "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">
                  Recommended
                </span>
                <span className="text-[#e8eaed]">
                  {data.specsDetails?.cpu?.rec || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* GPU Row */}
          <div className="flex flex-col bg-[#202124] p-5 rounded-xl border border-[#3c4043] shadow-inner gap-4">
            <div className="flex justify-between items-center border-b border-[#3c4043] pb-3">
              <span className="text-xl text-[#e8eaed] font-bold">GPU</span>
              <span
                className="text-lg font-bold"
                style={{ color: getComponentStyle(data.components.gpu).color }}
              >
                {getComponentStyle(data.components.gpu).text}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">
                  Your GPU
                </span>
                <span className="text-[#8ab4f8] font-semibold">
                  {data.specsDetails?.gpu?.user || "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">Minimum</span>
                <span className="text-[#e8eaed]">
                  {data.specsDetails?.gpu?.min || "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">
                  Recommended
                </span>
                <span className="text-[#e8eaed]">
                  {data.specsDetails?.gpu?.rec || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* RAM Row */}
          <div className="flex flex-col bg-[#202124] p-5 rounded-xl border border-[#3c4043] shadow-inner gap-4">
            <div className="flex justify-between items-center border-b border-[#3c4043] pb-3">
              <span className="text-xl text-[#e8eaed] font-bold">RAM</span>
              <span
                className="text-lg font-bold"
                style={{ color: getComponentStyle(data.components.ram).color }}
              >
                {getComponentStyle(data.components.ram).text}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">
                  Your RAM
                </span>
                <span className="text-[#8ab4f8] font-semibold">
                  {data.specsDetails?.ram?.user || "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">Minimum</span>
                <span className="text-[#e8eaed]">
                  {data.specsDetails?.ram?.min || "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#9aa0a6] mb-1 font-medium">
                  Recommended
                </span>
                <span className="text-[#e8eaed]">
                  {data.specsDetails?.ram?.rec || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-12 flex flex-col sm:flex-row gap-6">
        <button
          onClick={() => setView("games")}
          className="px-8 py-3 border border-[#5f6368] text-[#e8eaed] hover:bg-[#3c4043] rounded-full font-medium transition-colors"
        >
          Check Another Game
        </button>
        <button
          onClick={() => setView("pc-setup")}
          className="px-8 py-3 bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa] rounded-full font-bold transition-colors"
        >
          Change Specs
        </button>
      </div>
    </div>
  );
}
