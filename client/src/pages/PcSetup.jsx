import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ייבוא הראוטר
import API_CALL from "../api/API_CALL"; // ייבוא הפונקציה שלך
import HardwareInput from "../components/HardwareInput";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import { detectHardware } from "../utils/hardwareDetection"; // Imported utility

export default function PcSetup() {
  const navigate = useNavigate(); // הפעלת הניווט
  const { token, setUserPc } = useAuthStore();
  const [cpu, setCpu] = useState(null);
  const [gpu, setGpu] = useState(null);
  const [ram, setRam] = useState(16);
  const [saveMessage, setSaveMessage] = useState("");

  // New UI states for Auto-Detect feature
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectAlert, setDetectAlert] = useState(null);

  // New UI states for Deep Scan Desktop feature
  const [isScanning, setIsScanning] = useState(false);
  const [deepScanToken, setDeepScanToken] = useState("");

  useEffect(() => {
    let interval;
    if (isScanning && deepScanToken) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(
            `http://localhost:3000/api/hardware/sync-status/${deepScanToken}`,
          );
          const json = await res.json();

          if (json.success && json.status === "completed") {
            clearInterval(interval);
            setIsScanning(false);

            const {
              cpu: matchedCpu,
              gpu: matchedGpu,
              ram: matchedRam,
            } = json.data;

            // 1. Call the setter functions to bind the validated objects to the inputs
            if (matchedCpu) setCpu(matchedCpu);
            if (matchedGpu) setGpu(matchedGpu);
            if (matchedRam) setRam(matchedRam);
            console.log("Deep Scan Sync Applied to UI:", { matchedCpu, matchedGpu, matchedRam });

            setDetectAlert({
              type: "success",
              message:
                "✅ Deep Scan Complete! Found: " +
                (matchedCpu ? matchedCpu.model : "No CPU") +
                " & " +
                (matchedGpu ? matchedGpu.model : "No GPU") +
                ". Form auto-filled.",
            });
          }
        } catch (e) {
          console.error("Deep Scan Polling Error:", e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isScanning, deepScanToken]);

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    setDetectAlert(null);
    setSaveMessage("");

    try {
      const rawData = detectHardware();

      // TEMPORARY DIRECT FETCH TO ISOLATE NETWORK/PROXY ISSUES
      // Update the port below if your Express server is not on port 5000
      const response = await fetch(
        "http://localhost:3000/api/hardware/auto-detect",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rawData),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const res = await response.json();

      if (res.success) {
        const detectedGpu = res.data.gpu;
        const detectedRam = res.data.ram || 8;

        setRam(detectedRam);

        if (detectedGpu) {
          // Format name cleanly to avoid "Intel Intel UHD Graphics" duplication
          const cleanName = detectedGpu.model
            .toLowerCase()
            .startsWith(detectedGpu.brand.toLowerCase())
            ? detectedGpu.model
            : `${detectedGpu.brand} ${detectedGpu.model}`;

          const isIntegrated =
            cleanName.toLowerCase().includes("intel") ||
            cleanName.toLowerCase().includes("integrated");

          // Only overwrite if the user hasn't manually selected a GPU yet
          if (!gpu) {
            setGpu(detectedGpu);
          }

          if (isIntegrated) {
            setDetectAlert({
              type: "warning",
              message: `⚠️ Detected Integrated Graphics (${cleanName}). If you have a dedicated gaming GPU (NVIDIA/AMD), please search for it manually.`,
            });
          } else {
            setDetectAlert({
              type: "success",
              message: `✅ Auto-detected your GPU: ${cleanName}. Note: RAM may be higher than reported (${detectedRam}GB). CPU requires manual search.`,
            });
          }
        } else {
          setDetectAlert({
            type: "warning",
            message: `⚠️ We couldn't accurately verify your GPU. Please search for it manually. (Detected RAM: ${detectedRam}GB+)`,
          });
        }
      }
    } catch (err) {
      console.error("🔥 EXPLICIT AUTO-DETECT ERROR:", err);
      setDetectAlert({
        type: "error",
        message: "Failed to auto-detect hardware.",
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const startDeepScan = () => {
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    setDeepScanToken(token);
    setIsScanning(true);
    setDetectAlert(null);
  };

  const downloadDeepScanScript = () => {
    const batContent = `@echo off\necho PlayCheck Deep Scan Started...\necho Please wait while we analyze your hardware.\npowershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'SilentlyContinue'; $token='${deepScanToken}'; $cpu=(Get-CimInstance Win32_Processor | Select-Object -First 1).Name; $gpus=Get-CimInstance Win32_VideoController; $gpu=$gpus | Where-Object { $_.Name -notmatch 'Intel|HD Graphics|UHD|Basic Render' } | Select-Object -First 1; if (!$gpu) { $gpu = $gpus | Select-Object -First 1 }; $ram=[math]::round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB); $body = @{syncToken=$token; cpu=$cpu; gpu=$gpu.Name; ram=$ram} | ConvertTo-Json; try { Invoke-RestMethod -Uri 'http://localhost:3000/api/hardware/sync-submit' -Method Post -Body $body -ContentType 'application/json'; Write-Host 'Success! You can close this window and return to your browser.' -ForegroundColor Green } catch { Write-Host 'Failed to connect to the server.' -ForegroundColor Red }"\npause`;
    const blob = new Blob([batContent], { type: "application/bat" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PlayCheck_DeepScan.bat";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAndAnalyze = async () => {
    if (!cpu || !gpu) {
      setSaveMessage("⚠️ Please select both CPU and GPU.");
      return;
    }

    if (!cpu?._id || !gpu?._id) {
      toast.error(
        "Selected hardware is missing a valid ID. Please re-select from the search results.",
      );
      return;
    }

    const pcSpecs = { cpuId: cpu, gpuId: gpu, ramGb: ram };

    if (token) {
      try {
        // שימוש נקי ב-API_CALL במקום fetch ענק
        const data = await API_CALL("/api/user/specs", "PUT", {
          cpuId: cpu._id,
          gpuId: gpu._id,
          ramGb: ram, // מוודא שזה תואם לאיך שהשרת שלך מצפה לקבל את זה
        });

        if (data.success) {
          setUserPc(pcSpecs);
          localStorage.removeItem("guestSpecs");
          setSaveMessage("✅ Specs saved to Cloud!");
        }
      } catch {
        setSaveMessage("⚠️ Failed to save to Cloud. Network Error.");
        return; // במקרה של שגיאה, עוצרים ולא עוברים עמוד
      }
    } else {
      // מצב אורח
      localStorage.setItem("guestSpecs", JSON.stringify({ cpu, gpu, ram }));
      setSaveMessage("✅ Specs saved Locally (Guest Mode)!");
    }

    // אחרי השמירה - מעבירים לקטלוג המשחקים כדי שיוכלו לבדוק משחק
    setTimeout(() => {
      navigate("/catalog");
    }, 1500);
  };
  return (
    <div className="relative w-full min-h-screen">
      {/* אזור הרקע עם התמונה והטשטוש */}
      <div
        className="absolute top-0 left-0 w-full h-[55vh] bg-cover bg-center bg-no-repeat z-0 pointer-events-none"
        style={{ backgroundImage: "url('/setup-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#202124]/80 to-[#202124]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center pt-16 sm:pt-24 px-4 min-h-screen w-full">
        <h2 className="text-2xl sm:text-5xl text-white mb-6 sm:mb-8 font-bold text-center drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">
          Set Up Your PC Specs
        </h2>
        <div className="w-full max-w-2xl space-y-6">
          {/* Auto-Detect Action Area */}
          <div className="flex flex-col items-center bg-[#303134]/90 backdrop-blur-sm p-5 rounded-3xl border border-[#5f6368] shadow-lg mb-2 gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAutoDetect}
                disabled={isDetecting || isScanning}
                className="flex items-center justify-center gap-2 bg-[#FBBC05] hover:bg-[#f9ab00] text-[#202124] px-6 py-2.5 rounded-full font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDetecting ? (
                  <span className="w-4 h-4 border-2 border-[#202124] border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>🌐</span>
                )}
                Browser Auto-Detect
              </button>

              <button
                onClick={startDeepScan}
                disabled={isDetecting || isScanning}
                className="flex items-center justify-center gap-2 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] px-6 py-2.5 rounded-full font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>🖥️</span>
                Deep Scan (Desktop)
              </button>
            </div>

            {isScanning && (
              <div className="bg-[#202124] p-5 rounded-xl border border-[#8ab4f8] mt-2 text-center w-full max-w-md animate-fade-in">
                <p className="text-[#e8eaed] font-bold text-lg mb-3">
                  Deep Scan Initiated
                </p>
                <ol className="text-[#9aa0a6] text-sm mb-5 text-left list-decimal list-inside space-y-1">
                  <li>Download the secure scanner script below.</li>
                  <li>Run it on your Windows computer.</li>
                  <li>We will auto-fill the form instantly!</li>
                </ol>
                <button
                  onClick={downloadDeepScanScript}
                  className="bg-[#8ab4f8] text-[#202124] px-6 py-2 rounded-full font-bold hover:bg-[#aecbfa] transition-colors shadow-md w-full mb-4"
                >
                  ⬇️ Download Scanner (.bat)
                </button>
                <div className="flex justify-center items-center gap-3">
                  <span className="w-4 h-4 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></span>
                  <span className="text-[#8ab4f8] text-sm font-medium tracking-wide">
                    Listening for Token: {deepScanToken}
                  </span>
                </div>
                <button
                  onClick={() => setIsScanning(false)}
                  className="text-[#EA4335] text-xs mt-4 hover:underline"
                >
                  Cancel Scan
                </button>
              </div>
            )}

            {detectAlert && (
              <p
                className={`mt-4 text-sm font-medium text-center ${
                  detectAlert.type === "success"
                    ? "text-[#34A853]"
                    : detectAlert.type === "warning"
                      ? "text-[#FBBC05]"
                      : "text-[#EA4335]"
                }`}
              >
                {detectAlert.message}
              </p>
            )}
          </div>

          <HardwareInput
            type="CPU"
            placeholder="Search CPU (e.g. i7 13700K)..."
            onSelect={setCpu}
            value={cpu}
          />

          <HardwareInput
            type="GPU"
            placeholder="Search GPU (e.g. RTX 4070)..."
            onSelect={setGpu}
            value={gpu}
          />

          <div className="bg-[#303134]/90 backdrop-blur-sm p-5 sm:p-7 rounded-3xl border border-[#5f6368] shadow-lg">
            <div className="flex justify-between mb-4 text-[#e8eaed]">
              <span>System RAM:</span>
              <span className="text-[#8ab4f8] font-bold">{ram} GB</span>
            </div>
            <input
              type="range"
              min="4"
              max="128"
              step="4"
              value={ram}
              onChange={(e) => setRam(Number(e.target.value))}
              className="w-full h-1.5 bg-[#5f6368] rounded-lg appearance-none cursor-pointer accent-[#8ab4f8]"
            />
            <div className="flex justify-between text-xs text-[#9aa0a6] mt-3">
              <span>4GB</span>
              <span>128GB</span>
            </div>
          </div>

          <div className="flex flex-col items-center mt-8 space-y-4">
            {saveMessage && (
              <div
                className={`text-sm font-medium px-4 py-2 rounded-full border bg-[#303134] text-[#e8eaed] shadow-md ${saveMessage.includes("⚠️") ? "border-[#EA4335]" : "border-[#34A853]"}`}
              >
                {saveMessage}
              </div>
            )}
            <button
              onClick={handleSaveAndAnalyze}
              className="bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] px-8 py-3 rounded-full font-bold transition-colors shadow-lg"
            >
              Save & Browse Games
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
