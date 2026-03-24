import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ייבוא הראוטר
import API_CALL from "../api/API_CALL"; // ייבוא הפונקציה שלך
import HardwareInput from "../components/HardwareInput";
import useAuthStore from "../store/useAuthStore";

export default function PcSetup() {
  const navigate = useNavigate(); // הפעלת הניווט
  const { token, setUserPc } = useAuthStore();
  const [cpu, setCpu] = useState(null);
  const [gpu, setGpu] = useState(null);
  const [ram, setRam] = useState(16);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSaveAndAnalyze = async () => {
    if (!cpu || !gpu) {
      setSaveMessage("⚠️ Please select both CPU and GPU.");
      return;
    }

    if (!cpu?._id || !gpu?._id) {
      alert("⚠️ Error: Selected hardware is missing a valid ID. Please re-select from the search results.");
      return;
    }

    const pcSpecs = { cpuId: cpu, gpuId: gpu, ramGb: ram };

    if (token) {
      try {
        // שימוש נקי ב-API_CALL במקום fetch ענק
<<<<<<< HEAD
        const data = await API_CALL("/api/users/specs", "PUT", {
          cpuId: cpu._id,
          gpuId: gpu._id,
          ram_gb: ram, // מוודא שזה תואם לאיך שהשרת שלך מצפה לקבל את זה
=======
        const data = await API_CALL("/api/user/specs", "PUT", {
          cpuId: cpu._id,
          gpuId: gpu._id,
          ramGb: ram, // מוודא שזה תואם לאיך שהשרת שלך מצפה לקבל את זה
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
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
    <div className="flex flex-col items-center pt-24 px-4 min-h-screen">
      <h2 className="text-3xl text-[#e8eaed] mb-10">Set Up Your PC Specs</h2>
      <div className="w-full max-w-2xl space-y-6">
        
        <HardwareInput
          type="CPU"
          placeholder="Search CPU (e.g. i7 13700K)..."
          onSelect={setCpu}
        />
        
        <HardwareInput
          type="GPU"
          placeholder="Search GPU (e.g. RTX 4070)..."
          onSelect={setGpu}
        />

        <div className="bg-[#303134] p-7 rounded-3xl border border-[#5f6368]">
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
            <div className={`text-sm font-medium px-4 py-2 rounded-full border bg-[#303134] text-[#e8eaed] ${saveMessage.includes('⚠️') ? 'border-[#EA4335]' : 'border-[#34A853]'}`}>
              {saveMessage}
            </div>
          )}
          <button
            onClick={handleSaveAndAnalyze}
            className="bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] px-8 py-3 rounded-full font-bold transition-colors"
          >
            Save & Browse Games
          </button>
        </div>
      </div>
    </div>
  );
}