import { useState } from "react";
import HardwareInput from "../components/HardwareInput";

export default function MyComputer({ setView, token, setUser }) {
  const [cpu, setCpu] = useState(null);
  const [gpu, setGpu] = useState(null);
  const [ram, setRam] = useState(16);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSaveAndAnalyze = async () => {
    if (!cpu || !gpu) {
      setSaveMessage("⚠️ Please select both CPU and GPU.");
      return;
    }

    console.log("PAYLOAD DEBUG - CPU:", cpu, "GPU:", gpu);

    if (!cpu?._id || !gpu?._id) {
      console.error("Missing ID error - CPU:", cpu, "GPU:", gpu);
      alert(
        "⚠️ Error: Selected hardware is missing a valid ID. Please re-select from the search results.",
      );
      return;
    }

    if (token) {
      try {
        const res = await fetch("http://localhost:3000/api/users/specs", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cpuId: cpu._id,
            gpuId: gpu._id,
            ram_gb: ram,
          }),
        });

        const contentType = res.headers.get("content-type");
        if (
          !res.ok &&
          (!contentType || !contentType.includes("application/json"))
        ) {
          throw new Error("API route not found");
        }

        const data = await res.json();
        if (res.ok || data.success) {
          if (setUser) {
            setUser((prev) => {
              // Prefer the backend's source of truth if provided, otherwise fallback locally
              const updatedUser = {
                ...prev,
                ...data.data,
                myPc: data.data?.myPc || { cpuId: cpu, gpuId: gpu, ramGb: ram },
                my_pc: data.data?.my_pc || {
                  cpuId: cpu,
                  gpuId: gpu,
                  ram_gb: ram,
                },
              };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              return updatedUser;
            });
          }
          // CRITICAL: Explicitly clear local guest specs to prevent state conflicts
          localStorage.removeItem("guestSpecs");
          setSaveMessage("✅ Specs saved to Cloud!");
        } else {
          setSaveMessage("⚠️ Failed to save to Cloud.");
        }
      } catch (err) {
        setSaveMessage("⚠️ Network Error.");
      }
    } else {
      localStorage.setItem("guestSpecs", JSON.stringify({ cpu, gpu, ram }));
      setSaveMessage("✅ Specs saved Locally (Guest Mode)!");
    }

    setTimeout(() => {
      setView("result");
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center pt-24 px-4">
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
            onChange={(e) => setRam(e.target.value)}
            className="w-full h-1.5 bg-[#5f6368] rounded-lg appearance-none cursor-pointer accent-[#8ab4f8]"
          />
          <div className="flex justify-between text-xs text-[#9aa0a6] mt-3">
            <span>4GB</span>
            <span>128GB</span>
          </div>
        </div>

        <div className="flex flex-col items-center mt-8 space-y-4">
          {saveMessage && (
            <div className="text-sm font-medium px-4 py-2 rounded-full border bg-[#303134] text-[#e8eaed] border-[#5f6368]">
              {saveMessage}
            </div>
          )}
          <button
            onClick={handleSaveAndAnalyze}
            className="bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] px-8 py-3 rounded-full font-bold transition-colors"
          >
            Analyze Performance
          </button>
        </div>
      </div>
    </div>
  );
}
