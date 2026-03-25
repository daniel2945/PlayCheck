import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API_CALL from "../api/API_CALL";
import GameCard from "../components/GameCard";

// פונקציית הקסם להמרת ג'יבריש לעברית-אנגלית
const fixHebrewToEnglish = (text) => {
  const heb = "/'קראטוןםפשדגכעיחלךף,זסבהנמצתץ.";
  const eng = "qwertyuiopasdfghjkl;'zxcvbnm,./";
  let fixedText = "";
  for (let char of text) {
    const index = heb.indexOf(char);
    fixedText += index > -1 ? eng[index] : char;
  }
  return fixedText;
};

// רשימת הז'אנרים
const GENRES = [
  { id: "action", name: "Action" },
  { id: "adventure", name: "Adventure" },
  { id: "role-playing-games-rpg", name: "RPG" },
  { id: "shooter", name: "Shooter" },
  { id: "strategy", name: "Strategy" },
  { id: "simulation", name: "Simulation" },
  { id: "sports", name: "Sports" },
  { id: "racing", name: "Racing" },
  { id: "fighting", name: "Fighting" },
];

export default function GamesCatalog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const qFromUrl = searchParams.get("q") || "";
  const yearFromUrl = searchParams.get("year") || "";
  const genreFromUrl = searchParams.get("genre") || "";

  const [searchQuery, setSearchQuery] = useState(qFromUrl);
  const [selectedYear, setSelectedYear] = useState(yearFromUrl);
  const [selectedGenre, setSelectedGenre] = useState(genreFromUrl);

  const [games, setGames] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchGames = async (
    pageNum = 1,
    queryToUse = "",
    yearToUse = "",
    genreToUse = "",
    isLoadMore = false,
  ) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: pageNum,
      });

      if (queryToUse && queryToUse.trim() !== "") {
        // ✨ כאן אנחנו מתרגמים את המילה רגע לפני השליחה לשרת ✨
        const fixedQuery = fixHebrewToEnglish(queryToUse);
        params.append("q", fixedQuery);
      }
      if (yearToUse) {
        params.append("year", yearToUse);
      }
      if (genreToUse) {
        params.append("genre", genreToUse);
      }

      const endpoint = `/api/game/search?${params.toString()}`;
      const data = await API_CALL(endpoint);

      if (data.success && Array.isArray(data.data)) {
        if (isLoadMore) {
          setGames((prev) => [...prev, ...data.data]);
        } else {
          setGames(data.data);
        }
        setHasNextPage(data.hasNextPage);
        setPage(pageNum);
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
    setSearchQuery(qFromUrl);
    setSelectedYear(yearFromUrl);
    setSelectedGenre(genreFromUrl);
    fetchGames(1, qFromUrl, yearFromUrl, genreFromUrl, false);
  }, [qFromUrl, yearFromUrl, genreFromUrl]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (searchQuery) params.q = searchQuery;
    if (selectedYear) params.year = selectedYear;
    if (selectedGenre) params.genre = selectedGenre;
    setSearchParams(params);
  };

  const handleLoadMore = () => {
    fetchGames(page + 1, qFromUrl, yearFromUrl, genreFromUrl, true);
  };

  const handleGameClick = (game) => {
    navigate(`/details/${game.rawgId || game._id}`);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 37 }, (_, i) => currentYear - i);
  return (
    <div className="relative w-full min-h-screen">
      {/* אזור הרקע עם התמונה והטשטוש */}
      <div
        className="absolute top-0 left-0 w-full h-[55vh] bg-cover bg-center bg-no-repeat z-0 pointer-events-none"
        style={{ backgroundImage: "url('/catalog-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#202124]/80 to-[#202124]"></div>
      </div>

      {/* התוכן המקורי עטוף ב- z-10 */}
      <div className="relative z-10 pt-16 sm:pt-24 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen flex flex-col items-center w-full">
        <h2 className="text-2xl sm:text-4xl text-white mb-6 sm:mb-8 font-bold text-center drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">
          Search Games Catalog
        </h2>

        <form
          onSubmit={handleSearchSubmit}
          className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-3 mb-12 shadow-xl"
        >
          <input
            type="text"
            placeholder="Search for a game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 w-full p-3 sm:p-4 rounded-full bg-[#303134]/90 backdrop-blur-sm text-[#e8eaed] border border-[#5f6368] focus:outline-none focus:border-[#8ab4f8] text-base sm:text-lg"
          />

          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full md:w-auto p-3 sm:p-4 rounded-full bg-[#303134]/90 backdrop-blur-sm text-[#e8eaed] border border-[#5f6368] cursor-pointer outline-none text-base sm:text-lg"
          >
            <option value="">All Genres</option>
            {GENRES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full md:w-auto p-3 sm:p-4 rounded-full bg-[#303134]/90 backdrop-blur-sm text-[#e8eaed] border border-[#5f6368] cursor-pointer outline-none text-base sm:text-lg"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="w-full md:w-auto px-8 py-3 sm:py-4 bg-[#8ab4f8] text-[#202124] rounded-full font-bold hover:bg-[#aecbfa] transition-colors text-base sm:text-lg"
          >
            Search
          </button>
        </form>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12">
          {games.map((game) => {
            const releasedYear = game.releasedDate
              ? game.releasedDate.substring(0, 4)
              : "TBA";

            return (
              <div
                key={`game-card-${game.rawgId || game._id}`}
                onClick={() => handleGameClick(game)}
                className="cursor-pointer transition-transform hover:scale-105 h-full"
              >
                <GameCard
                  title={game.title || game.name}
                  imageUrl={game.image}
                  year={releasedYear}
                />
              </div>
            );
          })}
        </div>

        {hasNextPage && !loading && games.length > 0 && (
          <button
            onClick={handleLoadMore}
            className="mb-12 px-10 py-3 border border-[#8ab4f8] text-[#8ab4f8] hover:bg-[#8ab4f8] hover:text-[#202124] rounded-full font-bold transition-all"
          >
            Show More Results
          </button>
        )}

        {loading && (
          <p className="text-[#9aa0a6] mb-12 text-lg animate-pulse">
            Loading games...
          </p>
        )}
        {!loading && games.length === 0 && !error && (
          <p className="text-[#9aa0a6]">No games found for your search.</p>
        )}
        {error && <p className="text-[#EA4335]">{error}</p>}
      </div>
    </div>
  );
}