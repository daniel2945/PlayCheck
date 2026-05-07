import { useState, useEffect } from "react";
import useAuthStore from "../store/useAuthStore";
import HardwareInput from "../components/HardwareInput";

export default function Compare() {
  const { user } = useAuthStore();
  const [type, setType] = useState("GPU"); // מתחילים מהשוואת כרטיסי מסך
  const [currentHardware, setCurrentHardware] = useState(null);
  const [targetHardware, setTargetHardware] = useState(null);

  // משיכת החומרה הנוכחית של המשתמש (או מהפרופיל או ממצב אורח)
  useEffect(() => {
    let pc = null;
    if (user?.myPc && typeof user.myPc.cpuId === "object") {
      pc = user.myPc;
    } else {
      const guestSpecs = JSON.parse(localStorage.getItem("guestSpecs"));
      if (guestSpecs) pc = { cpuId: guestSpecs.cpu, gpuId: guestSpecs.gpu };
    }

    if (pc) {
      if (type === "CPU" && pc.cpuId) setCurrentHardware(pc.cpuId);
      else if (type === "GPU" && pc.gpuId) setCurrentHardware(pc.gpuId);
      else setCurrentHardware(null);
    } else {
      setCurrentHardware(null);
    }
    // איפוס חומרת היעד כשמחליפים בין CPU ל-GPU
    setTargetHardware(null);
  }, [type, user]);

  // פונקציית עזר לשמות
  const formatName = (hw) => {
    if (!hw) return "";
    const brand = hw.brand || "";
    const model = hw.model || "";
    return model.toLowerCase().startsWith(brand.toLowerCase())
      ? model
      : `${brand} ${model}`;
  };

  // לוגיקת חישוב ההשוואה
  let difference = 0;
  let isUpgrade = false;
  let isDowngrade = false;
  let currentScore = 0;
  let targetScore = 0;

  if (currentHardware && targetHardware) {
    currentScore = currentHardware.benchmarkScore || 1;
    targetScore = targetHardware.benchmarkScore || 1;
    difference = ((targetScore - currentScore) / currentScore) * 100;
    isUpgrade = difference > 0;
    isDowngrade = difference < 0;
  }

  return (
    <div className="relative w-full min-h-screen pb-16 overflow-x-hidden">
      {/* רקע ועיצוב */}
      <div className="absolute top-0 left-0 w-full h-[55vh] bg-[#121212] z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#8ab4f8]/10 via-[#202124]/80 to-[#202124]"></div>
      </div>

      <div className="relative z-10 pt-16 sm:pt-24 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col items-center">
        <h2 className="text-3xl sm:text-5xl text-white mb-3 sm:mb-4 font-bold text-center drop-shadow-lg leading-tight">
          Hardware Compare
        </h2>
        <p className="text-[#9aa0a6] text-base sm:text-lg text-center mb-8 sm:mb-10 max-w-2xl px-2">
          Thinking of upgrading? Select your current component and compare it to
          the one you want to buy to see the actual performance difference.
        </p>

        {/* כפתורי מעבר בין CPU ל GPU - תוקן למובייל */}
        <div className="flex w-full max-w-[320px] sm:max-w-md bg-[#303134] rounded-full p-1 border border-[#5f6368] mb-10 sm:mb-12 shadow-lg">
          <button
            onClick={() => setType("GPU")}
            className={`w-1/2 py-2.5 rounded-full font-bold text-sm sm:text-base transition-colors ${
              type === "GPU"
                ? "bg-[#8ab4f8] text-[#202124]"
                : "text-[#9aa0a6] hover:text-[#e8eaed]"
            }`}
          >
            Compare GPUs
          </button>
          <button
            onClick={() => setType("CPU")}
            className={`w-1/2 py-2.5 rounded-full font-bold text-sm sm:text-base transition-colors ${
              type === "CPU"
                ? "bg-[#8ab4f8] text-[#202124]"
                : "text-[#9aa0a6] hover:text-[#e8eaed]"
            }`}
          >
            Compare CPUs
          </button>
        </div>

        {/* גריד של שני הצדדים להשוואה */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full">
          {/* חומרה נוכחית */}
          <div className="bg-[#303134]/90 backdrop-blur-sm border border-[#5f6368] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col relative z-20">
            <h3 className="text-lg sm:text-xl text-[#e8eaed] font-bold mb-4 sm:mb-6 text-center border-b border-[#5f6368] pb-3 sm:pb-4">
              Current {type}
            </h3>
            <div className="flex-grow">
              <HardwareInput
                type={type}
                placeholder={`Search your current ${type}...`}
                value={currentHardware}
                onSelect={setCurrentHardware}
              />
            </div>
            {currentHardware && (
              <div className="mt-6 sm:mt-8 text-center bg-[#202124] py-3 sm:py-4 rounded-xl border border-white/5">
                <span className="text-[#9aa0a6] text-xs sm:text-sm uppercase tracking-widest block mb-1">
                  Benchmark Score
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {currentHardware.benchmarkScore?.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* חומרת יעד - הוסר overflow-hidden והוסף z-20 */}
          <div className="bg-[#303134]/90 backdrop-blur-sm border border-[#8ab4f8]/40 shadow-[0_0_20px_rgba(138,180,248,0.1)] rounded-3xl p-5 sm:p-6 flex flex-col relative z-20">
            {/* הפס הכחול העליון עכשיו עם פינות מעוגלות כדי שלא יפרוץ */}
            <div className="absolute top-0 left-0 w-full h-1 bg-[#8ab4f8] rounded-t-3xl"></div>
            <h3 className="text-lg sm:text-xl text-[#8ab4f8] font-bold mb-4 sm:mb-6 text-center border-b border-[#5f6368] pb-3 sm:pb-4">
              Upgrade Target
            </h3>
            <div className="flex-grow">
              <HardwareInput
                type={type}
                placeholder={`Search the ${type} you want...`}
                value={targetHardware}
                onSelect={setTargetHardware}
              />
            </div>
            {targetHardware && (
              <div className="mt-6 sm:mt-8 text-center bg-[#202124] py-3 sm:py-4 rounded-xl border border-white/5">
                <span className="text-[#9aa0a6] text-xs sm:text-sm uppercase tracking-widest block mb-1">
                  Benchmark Score
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {targetHardware.benchmarkScore?.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* אזור התוצאות! מופיע רק כששניהם נבחרו */}
        {currentHardware && targetHardware && (
          <div className="w-full mt-8 sm:mt-12 bg-[#28292c] border border-[#5f6368] rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in relative overflow-hidden text-center z-10">
            {/* הילה צבעונית ברקע */}
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-20"
              style={{
                backgroundColor: isUpgrade
                  ? "#34A853"
                  : isDowngrade
                    ? "#EA4335"
                    : "#9aa0a6",
              }}
            ></div>

            <h3 className="text-xl sm:text-2xl text-[#e8eaed] font-medium mb-2">
              Performance Difference
            </h3>

            {/* טקסט האחוזים */}
            <div className="flex items-center justify-center my-4 sm:my-6 break-words">
              <span
                className="text-5xl sm:text-8xl font-black drop-shadow-md tracking-tighter"
                style={{
                  color: isUpgrade
                    ? "#34A853"
                    : isDowngrade
                      ? "#EA4335"
                      : "#e8eaed",
                }}
              >
                {isUpgrade ? "+" : ""}
                {difference.toFixed(1)}%
              </span>
            </div>

            <p className="text-base sm:text-xl text-[#9aa0a6] leading-relaxed">
              The{" "}
              <span className="text-white font-bold">
                {formatName(targetHardware)}
              </span>{" "}
              is{" "}
              <span
                className="font-bold px-2 py-1 sm:py-0.5 rounded text-white inline-block mt-1 sm:mt-0"
                style={{
                  backgroundColor: isUpgrade
                    ? "#34A853"
                    : isDowngrade
                      ? "#EA4335"
                      : "#5f6368",
                }}
              >
                {Math.abs(difference).toFixed(1)}%{" "}
                {isUpgrade ? "FASTER" : isDowngrade ? "SLOWER" : "EQUAL"}
              </span>{" "}
              than your{" "}
              <span className="text-white font-bold">
                {formatName(currentHardware)}
              </span>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}