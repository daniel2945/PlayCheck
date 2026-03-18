export default function Result({ setView }) {
  return (
    <div className="flex flex-col items-center pt-24 px-4">
      <h2 className="text-3xl text-[#e8eaed] mb-12">Performance Analysis</h2>

      {/* Circular Progress Placeholder */}
      <div className="relative w-64 h-64 bg-[#303134] rounded-full flex items-center justify-center mb-10 shadow-xl border-8 border-[#34A853]">
        <div className="text-center">
          <span className="text-5xl font-bold text-[#e8eaed]">85%</span>
          <p className="text-[#9aa0a6] mt-2">You Can Run It!</p>
        </div>
      </div>

      <div className="bg-[#303134] border border-[#5f6368] rounded-xl p-6 w-full max-w-2xl text-[#e8eaed]">
        <h3 className="text-xl mb-4 border-b border-[#5f6368] pb-2">
          Your Specs vs Required
        </h3>
        <div className="flex justify-between py-2">
          <span className="text-[#9aa0a6]">CPU</span>
          <span className="text-[#34A853]">Meets Requirements</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-[#9aa0a6]">GPU</span>
          <span className="text-[#34A853]">Meets Requirements</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-[#9aa0a6]">RAM</span>
          <span className="text-[#fbbc05]">Minimum Specs</span>
        </div>
      </div>

      <button
        onClick={() => setView("games")}
        className="mt-8 text-[#8ab4f8] hover:underline"
      >
        Back to Games
      </button>
    </div>
  );
}
