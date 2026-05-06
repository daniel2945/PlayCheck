import { Link } from "react-router-dom";
import useAuthStore from "../store/useAuthStore"; // ייבוא ה-Store
import TrendingCarousel from "../components/TrendingCarousel";

export default function Home() {
  // שליפת המשתמש מה-Store
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen flex flex-col bg-[#121212]">
      {/* Hero Section */}
      <div className="relative w-full flex-shrink-0 flex flex-col items-center justify-center py-32 min-h-[85vh] overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0 scale-105"
          style={{ backgroundImage: "url('/games-collage.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#121212]/40 via-[#121212]/80 to-[#121212]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-[#8ab4f8]/10 border border-[#8ab4f8]/20 backdrop-blur-md">
            <span className="text-[#8ab4f8] font-semibold text-sm tracking-widest uppercase">
              The Ultimate PC Gaming Companion
            </span>
          </div>
          <h1 className="text-5xl sm:text-7xl text-white mb-6 font-extrabold tracking-tight drop-shadow-2xl">
            Can Your PC Run It UP?
          </h1>
          <p className="text-xl sm:text-2xl text-[#9aa0a6] mb-12 max-w-3xl font-medium drop-shadow-md leading-relaxed">
            Stop guessing and start playing. Compare your hardware against the
            latest games, find the best deals, and read reviews from players
            with the exact same setup.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center w-full sm:w-auto">
            <Link
              to="/catalog"
              className="bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] font-bold px-8 py-4 rounded-full transition-transform hover:-translate-y-1 shadow-[0_4px_15px_rgba(138,180,248,0.3)] text-lg flex items-center justify-center gap-2"
            >
              Browse Games
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                ></path>
              </svg>
            </Link>

            <Link
              to="/setup"
              className="bg-[#303134] hover:bg-[#3c4043] border border-[#5f6368] text-[#e8eaed] font-bold px-8 py-4 rounded-full transition-transform hover:-translate-y-1 shadow-lg text-lg flex items-center justify-center gap-2"
            >
              Setup My PC
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative z-10 w-full bg-[#121212] py-20 px-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#e8eaed] mb-4">
              How PlayCheck Works
            </h2>
            <p className="text-[#9aa0a6] text-lg max-w-2xl mx-auto">
              Three simple steps to ensure you never buy a game your PC can't
              handle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-[#1e1e20] p-8 rounded-3xl border border-white/5 hover:border-[#8ab4f8]/30 transition-colors flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-[#8ab4f8]/10 text-[#8ab4f8] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#e8eaed] mb-3">
                1. Add Your Specs
              </h3>
              <p className="text-[#9aa0a6] mb-6 leading-relaxed">
                Enter your CPU, GPU, and RAM manually, or use our Deep Scan tool
                to auto-detect your hardware instantly.
              </p>
              <Link
                to="/setup"
                className="mt-auto text-[#8ab4f8] font-medium hover:underline inline-flex items-center gap-1"
              >
                Set up now{" "}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
              </Link>
            </div>

            {/* Step 2 */}
            <div className="bg-[#1e1e20] p-8 rounded-3xl border border-white/5 hover:border-[#34A853]/30 transition-colors flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-[#34A853]/10 text-[#34A853] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg
                  className="w-10 h-10"
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
              </div>
              <h3 className="text-xl font-bold text-[#e8eaed] mb-3">
                2. Search Any Game
              </h3>
              <p className="text-[#9aa0a6] mb-6 leading-relaxed">
                Browse our extensive catalog of games, from the latest AAA
                releases to your favorite indie gems.
              </p>
              <Link
                to="/catalog"
                className="mt-auto text-[#34A853] font-medium hover:underline inline-flex items-center gap-1"
              >
                Browse catalog{" "}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
              </Link>
            </div>

            {/* Step 3 */}
            <div className="bg-[#1e1e20] p-8 rounded-3xl border border-white/5 hover:border-[#FBBC05]/30 transition-colors flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-[#FBBC05]/10 text-[#FBBC05] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#e8eaed] mb-3">
                3. Get Instant Results
              </h3>
              <p className="text-[#9aa0a6] mb-6 leading-relaxed">
                See exactly how well the game will run, identify system
                bottlenecks, and read hardware-matched reviews.
              </p>
              <span className="mt-auto text-[#FBBC05] font-medium flex items-center gap-1">
                Instant analysis{" "}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Section */}
      <div className="relative z-10 w-full bg-[#121212] pt-16 pb-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto w-full px-4">
          <TrendingCarousel />
        </div>
      </div>

      {/* Additional Features / Why Us Section */}
      <div className="relative z-10 w-full bg-gradient-to-b from-[#121212] to-[#1e1e20] py-24 px-4 flex-grow">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <h2 className="text-3xl sm:text-5xl font-bold text-[#e8eaed] leading-tight">
              More Than Just <br />
              <span className="text-[#8ab4f8]">Requirements</span>
            </h2>

            <div className="space-y-8 mt-10">
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-14 h-14 bg-[#202124] border border-white/10 rounded-full flex items-center justify-center text-[#8ab4f8] shadow-lg">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[#e8eaed] mb-2">
                    Hardware-Matched Reviews
                  </h4>
                  <p className="text-[#9aa0a6] leading-relaxed text-lg">
                    Read reviews exclusively from players who have a PC setup
                    similar to yours. Know exactly what performance to expect in
                    the real world.
                  </p>
                </div>
              </div>

              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-14 h-14 bg-[#202124] border border-white/10 rounded-full flex items-center justify-center text-[#34A853] shadow-lg">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[#e8eaed] mb-2">
                    Live Deal Finder
                  </h4>
                  <p className="text-[#9aa0a6] leading-relaxed text-lg">
                    PlayCheck automatically scans top official stores to find
                    you the best and cheapest deals on games that your PC can
                    run.
                  </p>
                </div>
              </div>

              {/* ✨ התוספת החדשה: Hardware Simulator ✨ */}
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-14 h-14 bg-[#202124] border border-white/10 rounded-full flex items-center justify-center text-[#FBBC05] shadow-lg">
                  <svg 
                    className="w-6 h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    ></path>
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[#e8eaed] mb-2">
                    Hardware Simulator
                  </h4>
                  <p className="text-[#9aa0a6] leading-relaxed text-lg">
                    Thinking about an upgrade? Test different CPUs, GPUs, and RAM directly within the compatibility results to see exactly how a new rig would handle your favorite games.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action Card */}
          <div className="w-full lg:w-[450px] bg-[#202124] p-10 rounded-3xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8ab4f8]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10 text-center flex flex-col h-full justify-center">
              <h3 className="text-3xl font-bold text-white mb-4">
                Ready to start?
              </h3>
              <p className="text-[#9aa0a6] mb-8 text-lg">
                Join the community, save your PC specs to the cloud, and never
                worry about game requirements again.
              </p>

              {!user ? (
                <Link
                  to="/login"
                  className="w-full bg-[#e8eaed] text-[#202124] font-bold py-4 rounded-xl hover:bg-white transition-colors shadow-lg text-lg flex items-center justify-center gap-2"
                >
                  Create Free Account
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    ></path>
                  </svg>
                </Link>
              ) : (
                <Link
                  to="/profile"
                  className="w-full bg-[#34A853] text-[#202124] font-bold py-4 rounded-xl hover:bg-[#2d9047] transition-colors shadow-lg text-lg flex items-center justify-center gap-2"
                >
                  Go to My Profile
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}