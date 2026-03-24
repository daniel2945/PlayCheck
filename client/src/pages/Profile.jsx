import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

export default function Profile() {
  const { user } = useAuthStore();
  // Simplified specs state, directly reflecting the clean data we now expect
  const [specs, setSpecs] = useState(null);

  useEffect(() => {
    // The App router ensures only authenticated users reach this page.
    // With the server bug fixed, we can now rely on a consistent data structure.
    if (user && user.myPc && user.myPc.cpuId && user.myPc.gpuId) {
      setSpecs({
        cpu: user.myPc.cpuId, // This will be the populated object from the server
        gpu: user.myPc.gpuId, // This will be the populated object
        ram: user.myPc.ramGb,
      });
    } else {
      // If the user object or myPc specs are not present, ensure specs are null.
      setSpecs(null);
    }
  }, [user]);

  // Helper function to safely render hardware name
  const getHardwareName = (hardware) => {
    if (!hardware || typeof hardware !== 'object') return "Not Set";
    return `${hardware.brand || ""} ${hardware.model || ""}`.trim();
  }

  return (
    <div className="px-6 py-12 max-w-4xl mx-auto space-y-8 min-h-screen">
      <h2 className="text-3xl text-[#e8eaed] font-medium border-b border-[#5f6368] pb-4">
        Hello, <span className="text-[#8ab4f8]">{user?.userName || "Gamer"}</span>
      </h2>

      {/* Hardware Specs Section */}
      <div className="bg-[#303134] border border-[#5f6368] rounded-xl p-6">
        <h3 className="text-xl text-[#8ab4f8] mb-4">My Computer Specs</h3>
        
        {specs ? (
          <div className="space-y-3 text-[#e8eaed] text-lg">
            <p className="flex items-center">
              <span className="text-[#9aa0a6] font-medium w-20">CPU:</span>
              <span className="bg-[#202124] px-3 py-1 rounded-md border border-[#5f6368]">
                {getHardwareName(specs.cpu)}
              </span>
            </p>
            <p className="flex items-center">
              <span className="text-[#9aa0a6] font-medium w-20">GPU:</span>
              <span className="bg-[#202124] px-3 py-1 rounded-md border border-[#5f6368]">
                {getHardwareName(specs.gpu)}
              </span>
            </p>
            <p className="flex items-center">
              <span className="text-[#9aa0a6] font-medium w-20">RAM:</span>
              <span className="bg-[#202124] px-3 py-1 rounded-md border border-[#5f6368]">
                {specs.ram} GB
              </span>
            </p>
            
            <div className="mt-6 pt-4 border-t border-[#5f6368]">
              <Link to="/setup" className="text-sm text-[#8ab4f8] hover:text-[#aecbfa] transition-colors">
                Update Specs
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="text-[#9aa0a6]">You haven't saved your PC specs yet.</p>
            <Link 
              to="/setup" 
              className="bg-[#8ab4f8] text-[#202124] px-6 py-2 rounded-full font-bold hover:bg-[#aecbfa] transition-colors"
            >
              Set Up My PC
            </Link>
          </div>
        )}
      </div>

      {/* Future Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#303134] border border-[#5f6368] rounded-xl p-6 opacity-60">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl text-[#8ab4f8]">Recommended Games</h3>
            <span className="text-xs bg-[#202124] text-[#9aa0a6] px-2 py-1 rounded border border-[#5f6368]">Coming Soon</span>
          </div>
          <p className="text-[#9aa0a6] text-sm">Personalized game recommendations based on your hardware will appear here.</p>
        </div>

        <div className="bg-[#303134] border border-[#5f6368] rounded-xl p-6 opacity-60">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl text-[#8ab4f8]">Search History</h3>
            <span className="text-xs bg-[#202124] text-[#9aa0a6] px-2 py-1 rounded border border-[#5f6368]">Coming Soon</span>
          </div>
          <p className="text-[#9aa0a6] text-sm">A log of your recent hardware compatibility checks.</p>
        </div>
      </div>

    </div>
  );
}