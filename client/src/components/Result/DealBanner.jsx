import React, { useState, useEffect } from "react";

const STORE_NAMES = {
  1: "Steam", 2: "GamersGate", 3: "GreenManGaming", 4: "Amazon",
  5: "GameStop", 7: "GOG", 8: "Origin", 11: "Humble Store",
  13: "Uplay", 15: "Fanatical", 23: "WinGameStore", 24: "GameBillet",
  25: "Epic Games", 27: "Gamesplanet", 28: "Gamesload", 29: "2Game",
  30: "IndieGala", 31: "Blizzard Shop", 32: "AllYouPlay", 33: "DLGamer",
  34: "Noctre", 35: "DreamGame",
};

export default function DealBanner({ gameTitle }) {
  const [deal, setDeal] = useState(null);
  const [dealLoading, setDealLoading] = useState(false);
  const [dealSearched, setDealSearched] = useState(false);

  const validateDeal = (ourTitle, dealTitle) => {
    const clean = (t) => t.toLowerCase().replace(/edition|director's cut|remastered|goty|game of the year/gi, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    const ours = clean(ourTitle);
    const theirs = clean(dealTitle);
    if (ours === theirs) return true;
    const ourWords = ours.split(" ");
    const theirWords = theirs.split(" ");
    const extractNumbers = (words) => words.filter((w) => !isNaN(w)).join("");
    if (extractNumbers(ourWords) !== extractNumbers(theirWords)) return false;
    return ourWords.every((w) => theirWords.includes(w)) || theirWords.every((w) => ourWords.includes(w));
  };

  useEffect(() => {
    const fetchGameDeal = async () => {
      if (!gameTitle) return;
      setDealLoading(true); setDealSearched(false);
      try {
        let cleanTitle = gameTitle.replace(/Edition|Director's Cut|Remastered|GOTY/gi, "").replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
        const res = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(cleanTitle)}&limit=10`);
        const dealData = await res.json();
        if (dealData && dealData.length > 0) {
          const validMatch = dealData.find((d) => validateDeal(gameTitle, d.external));
          if (validMatch) {
            const specificDealRes = await fetch(`https://www.cheapshark.com/api/1.0/deals?id=${validMatch.cheapestDealID}`);
            const specificDealData = await specificDealRes.json();
            setDeal({ ...validMatch, storeID: specificDealData.gameInfo.storeID, retailPrice: specificDealData.gameInfo.retailPrice, salePrice: specificDealData.gameInfo.salePrice });
          } else setDeal(null);
        } else setDeal(null);
      } catch (err) {
        console.error("Deal fetch err:", err);
      } finally {
        setDealLoading(false); setDealSearched(true);
      }
    };
    fetchGameDeal();
  }, [gameTitle]);

  if (dealLoading) return (
    <div className="w-full max-w-5xl mx-auto mb-12 relative z-10 bg-[#202124] rounded-xl p-5 border border-[#3c4043] flex flex-col items-center justify-center gap-3">
      <div className="w-6 h-6 border-2 border-[#FBBC05] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[#9aa0a6] text-sm font-medium">🔍 Scanning stores for deals...</p>
    </div>
  );

  if (!deal && dealSearched) return (
    <div className="w-full max-w-5xl mx-auto mb-12 relative z-10 bg-[#202124] rounded-xl p-4 border border-[#3c4043] text-center">
      <span className="text-[#9aa0a6] text-sm">No active deals found across official stores right now.</span>
    </div>
  );

  if (!deal) return null;

  const storeName = STORE_NAMES[deal.storeID] || "Official Store";
  const salePrice = parseFloat(deal.salePrice || deal.cheapest);
  const retailPrice = parseFloat(deal.retailPrice || deal.cheapest);
  const isDiscounted = retailPrice > salePrice;
  const discountPercent = isDiscounted ? Math.round((1 - salePrice / retailPrice) * 100) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto mb-12 relative z-10">
      <div className="bg-gradient-to-r from-[#1a1b1e] to-[#202124] p-1 rounded-2xl shadow-[0_0_20px_rgba(251,188,5,0.1)] hover:shadow-[0_0_25px_rgba(251,188,5,0.2)] transition-shadow">
        <div className="bg-[#202124] rounded-xl p-5 border border-[#FBBC05]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="text-xs font-bold text-[#FBBC05] uppercase tracking-wider">🔥 Best Deal</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-[#e8eaed]">{storeName}</span>
            </div>
            <div className="text-[#e8eaed] font-medium flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
              {isDiscounted && <span className="text-[#9aa0a6] line-through text-sm">${retailPrice.toFixed(2)}</span>}
              <span className="text-[#34A853] font-black text-2xl">${salePrice.toFixed(2)}</span>
              {isDiscounted && <span className="text-xs font-bold bg-[#34A853]/20 text-[#34A853] px-2 py-1 rounded">-{discountPercent}%</span>}
            </div>
          </div>
          <a href={`https://www.cheapshark.com/redirect?dealID=${deal.cheapestDealID}`} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-gradient-to-r from-[#FBBC05] to-[#f9ab00] hover:from-[#f9ab00] hover:to-[#ea8600] text-[#202124] rounded-xl font-bold transition-transform hover:scale-105 shadow-md whitespace-nowrap shrink-0 flex items-center gap-2">
            Buy Now
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}