import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_CALL from "../api/API_CALL";
import GameCard from "../components/GameCard";

export default function GamesCatalog() {
  const navigate = useNavigate();
  
  // הסטייט של הטופס
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // הסטייט ה"נעול" - קריטי כדי ש'טען עוד' יזכור מה אנחנו מסננים
  const [activeQuery, setActiveQuery] = useState("");
  const [activeYear, setActiveYear] = useState("");

  const [games, setGames] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchGames = async (pageNum = 1, queryToUse = "", yearToUse = "", isLoadMore = false) => {
    setLoading(true);
    setError("");
    try {
      // לא שולחים "popular" יותר! 
      const params = new URLSearchParams({
        page: pageNum,
      });

      // מוסיפים q רק אם באמת הקלדת טקסט
      if (queryToUse && queryToUse.trim() !== "") {
        params.append("q", queryToUse);
      }

      if (yearToUse) {
        params.append("year", yearToUse);
      }

      const endpoint = `/api/game/search?${params.toString()}`;
      const data = await API_CALL(endpoint);

      if (data.success && Array.isArray(data.data)) {
        if (isLoadMore) {
          setGames((prev) => [...prev, ...data.data]);
        } else {
          setGames(data.data);
        }
        
        // השרת שלך כבר מחזיר hasNextPage מוכן! משתמשים בו ישירות
        setHasNextPage(data.hasNextPage);
        setPage(pageNum);
        setActiveQuery(queryToUse);
        setActiveYear(yearToUse);
      } else {
        if (!isLoadMore) setGames([]);
        setHasNextPage(false);
      }
    } catch (err) {
      setError("Failed to load games. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames(1, "", "", false);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGames(1, searchQuery, selectedYear, false);
  };

  const handleLoadMore = () => {
    fetchGames(page + 1, activeQuery, activeYear, true);
  };

  const handleGameClick = (game) => {
    navigate(`/details/${game.rawgId || game._id}`);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 37 }, (_, i) => currentYear - i);

  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto min-h-screen flex flex-col items-center">
      <h2 className="text-3xl text-[#e8eaed] mb-8 font-medium">Search Games Catalog</h2>

      <form onSubmit={handleSearchSubmit} className="w-full max-w-3xl flex flex-col md:flex-row items-center gap-3 mb-12">
        <input
          type="text"
          placeholder="Search for a game..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 w-full p-4 rounded-full bg-[#303134] text-[#e8eaed] border border-[#5f6368] focus:outline-none focus:border-[#8ab4f8] text-lg"
        />
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="p-4 rounded-full bg-[#303134] text-[#e8eaed] border border-[#5f6368] cursor-pointer outline-none"
        >
          <option value="">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button type="submit" className="px-8 py-4 bg-[#8ab4f8] text-[#202124] rounded-full font-bold hover:bg-[#aecbfa] transition-colors">
          Search
        </button>
      </form>

      {/* גריד המשחקים */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12">
        {games.map((game) => {
          // ✨ התיקון הקריטי: קוראים לזה releaseDate בדיוק כמו בשרת שלך!
          const releasedYear = game.releasedDate ? game.releasedDate.substring(0, 4) : "TBA";
          
          return (
            <div key={game.rawgId} onClick={() => handleGameClick(game)} className="cursor-pointer transition-transform hover:scale-105 h-full">
              <GameCard title={game.name} imageUrl={game.image} year={releasedYear} />
            </div>
          );
        })}
      </div>

      {/* כפתור טעינה נוספת */}
      {hasNextPage && !loading && games.length > 0 && (
        <button
          onClick={handleLoadMore}
          className="mb-12 px-10 py-3 border border-[#8ab4f8] text-[#8ab4f8] hover:bg-[#8ab4f8] hover:text-[#202124] rounded-full font-bold transition-all"
        >
          Show More Results
        </button>
      )}

      {loading && <p className="text-[#9aa0a6] mb-12 text-lg animate-pulse">Loading games...</p>}
      {!loading && games.length === 0 && !error && <p className="text-[#9aa0a6]">No games found for your search.</p>}
      {error && <p className="text-[#EA4335]">{error}</p>}
    </div>
  );
}