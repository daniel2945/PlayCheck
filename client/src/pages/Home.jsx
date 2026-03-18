export default function Home({ setView }) {
  return (
    <div className="flex flex-col items-center justify-center pt-32 px-4 text-center">
      <h1 className="text-6xl sm:text-7xl font-medium mb-8 tracking-tighter cursor-default">
        <span className="text-[#4285F4]">P</span>
        <span className="text-[#EA4335]">l</span>
        <span className="text-[#FBBC05]">a</span>
        <span className="text-[#4285F4]">y</span>
        <span className="text-[#34A853]">C</span>
        <span className="text-[#EA4335]">h</span>
        <span className="text-white">eck</span>
      </h1>

      <div className="w-full max-w-2xl mb-10">
        <div className="flex items-center bg-[#303134] border border-[#5f6368] rounded-full px-5 py-3.5 hover:bg-[#3c4043] focus-within:bg-[#303134] focus-within:shadow-lg focus-within:border-[#8ab4f8] transition-all">
          <svg
            className="w-5 h-5 text-[#9aa0a6] mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
          <input
            type="text"
            placeholder="Search for a game to check..."
            className="bg-transparent flex-1 outline-none text-lg text-[#e8eaed] placeholder-[#9aa0a6] ml-2"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => setView("games")}
          className="bg-[#303134] hover:bg-[#3c4043] border border-[#5f6368] text-[#e8eaed] px-6 py-2.5 rounded-md transition-colors"
        >
          Check Games
        </button>
        <button
          onClick={() => setView("login")}
          className="bg-[#303134] hover:bg-[#3c4043] border border-[#5f6368] text-[#e8eaed] px-6 py-2.5 rounded-md transition-colors"
        >
          Login / Register
        </button>
      </div>
    </div>
  );
}
