import React from "react";

export default function GameHeader({ gameTitle, gameImage }) {
  const fallbackImage = "https://placehold.co/600x400/1a1a1a/ffffff?text=No+Image";

  return (
    <div className="relative w-full max-w-5xl mb-12 h-auto sm:h-52 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] border border-white/10 overflow-hidden flex flex-col sm:flex-row z-10">
      <div
        className="absolute inset-0 bg-cover bg-center blur-3xl saturate-50 scale-110 z-0 opacity-80"
        style={{ backgroundImage: `url(${gameImage || fallbackImage})` }}
      ></div>
      <div className="absolute inset-0 bg-black/60 sm:bg-gradient-to-r sm:from-black/90 sm:via-black/60 sm:to-black/40 z-0"></div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-center w-full h-full p-6 gap-6 sm:gap-8">
        <div className="h-48 sm:h-full w-full sm:w-auto shrink-0 flex items-center justify-center">
          <img
            src={gameImage || fallbackImage}
            alt={gameTitle}
            className="h-full w-auto object-contain rounded-lg drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            onError={(e) => {
              e.target.src = fallbackImage;
            }}
          />
        </div>

        <div className="flex flex-col text-center sm:text-left justify-center flex-1 py-2 sm:py-0">
          <h2 className="text-4xl sm:text-6xl text-white mb-2 font-extrabold tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] line-clamp-2">
            {gameTitle}
          </h2>
          <p className="text-[#8ab4f8] text-sm sm:text-xl font-bold tracking-[0.2em] uppercase opacity-90 drop-shadow-md">
            Performance Analysis
          </p>
        </div>
      </div>
    </div>
  );
}