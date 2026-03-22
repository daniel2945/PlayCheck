import { useState, useEffect } from "react";

export default function Profile({ token, user }) {
  const [specs, setSpecs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      if (user) {
        const pc = user.myPc || user.my_pc;
        if (pc && (pc.cpuId || pc.cpu)) {
          setSpecs({
            cpu: pc.cpuId || pc.cpu,
            gpu: pc.gpuId || pc.gpu,
            ram: pc.ramGb || pc.ram_gb || pc.ram,
          });
        } else {
          setSpecs(null);
        }
        setLoading(false);
      }
    } else {
      const localSpecs = JSON.parse(localStorage.getItem("guestSpecs"));
      setSpecs(localSpecs || null);
      setLoading(false);
    }
  }, [token, user]);

  return (
    <div className="px-6 py-12 max-w-4xl mx-auto space-y-8">
      <h2 className="text-3xl text-[#e8eaed] font-medium border-b border-[#5f6368] pb-4">
        User Dashboard
      </h2>

      <div className="bg-[#303134] border border-[#5f6368] rounded-xl p-6">
        <h3 className="text-xl text-[#8ab4f8] mb-4">My Computer Specs</h3>
        {loading ? (
          <p className="text-[#9aa0a6]">Loading specs...</p>
        ) : specs ? (
          <div className="space-y-2 text-[#e8eaed]">
            <p>
              <span className="text-[#9aa0a6] inline-block w-16">CPU:</span>{" "}
              {specs.cpu
                ? `${specs.cpu.brand || ""} ${specs.cpu.model || ""}`.trim()
                : "Not selected"}
            </p>
            <p>
              <span className="text-[#9aa0a6] inline-block w-16">GPU:</span>{" "}
              {specs.gpu
                ? `${specs.gpu.brand || ""} ${specs.gpu.model || ""}`.trim()
                : "Not selected"}
            </p>
            <p>
              <span className="text-[#9aa0a6] inline-block w-16">RAM:</span>{" "}
              {specs.ram || specs.ram_gb || 0} GB
            </p>
          </div>
        ) : (
          <p className="text-[#9aa0a6]">No specs saved yet.</p>
        )}
      </div>

      <div className="bg-[#303134] border border-[#5f6368] rounded-xl p-6">
        <h3 className="text-xl text-[#8ab4f8] mb-4">Recommended Games</h3>
        <ul className="list-disc list-inside text-[#e8eaed] space-y-1">
          <li>Elden Ring</li>
          <li>Spider-Man Remastered</li>
          <li>God of War</li>
        </ul>
      </div>

      <div className="bg-[#303134] border border-[#5f6368] rounded-xl p-6">
        <h3 className="text-xl text-[#8ab4f8] mb-4">Search History</h3>
        <div className="text-[#9aa0a6] text-sm space-y-2">
          <p>• Checked Cyberpunk 2077 (Result: 85%)</p>
          <p>• Checked Starfield (Result: 60%)</p>
        </div>
      </div>
    </div>
  );
}
