import { useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API_CALL from "../api/API_CALL";
import GameCard from "../components/GameCard";
import useGameStore from "../store/useGameStore";

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
  const observer = useRef();

  const {
    games,
    page,
    hasNextPage,
    filters,
    loading,
    error,
    setGames,
    appendGames,
    setPage,
    setHasNextPage,
    setFilters,
    setLoading,
    setError,
  } = useGameStore();

  const qFromUrl = searchParams.get("q") || "";
  const yearFromUrl = searchParams.get("year") || "";
  const genreFromUrl = searchParams.get("genre") || "";

  const lastGameElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          setPage(page + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasNextPage, page, setPage],
  );

  const fetchGames = async (
    pageNum = 1,
    queryToUse = "",
    yearToUse = "",
    genreToUse = "",
    isLoadMore = false,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pageNum,
        pageSize: 16,
      });

      if (queryToUse && queryToUse.trim() !== "") {
        const fixedQuery = fixHebrewToEnglish(queryToUse);
        params.append("q", fixedQuery);
      }
      if (yearToUse) params.append("year", yearToUse);
      if (genreToUse) params.append("genre", genreToUse);

      const endpoint = `/api/game/search?${params.toString()}`;
      const data = await API_CALL(endpoint);

      if (data.success && Array.isArray(data.data)) {
        if (isLoadMore) {
          appendGames(data.data);
        } else {
          setGames(data.data);
        }
        setHasNextPage(data.hasNextPage);
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

  // Sync filters from URL and fetch initial if needed
  useEffect(() => {
    const filtersChanged = 
      filters.q !== qFromUrl || 
      filters.year !== yearFromUrl || 
      filters.genre !== genreFromUrl;

    if (filtersChanged) {
      setFilters({ q: qFromUrl, year: yearFromUrl, genre: genreFromUrl });
      fetchGames(1, qFromUrl, yearFromUrl, genreFromUrl, false);
    } else if (games.length === 0) {
      // Fetch if store is empty but filters match (e.g. initial navigation)
      fetchGames(1, qFromUrl, yearFromUrl, genreFromUrl, false);
    }
  }, [qFromUrl, yearFromUrl, genreFromUrl]);

  // Fetch more when page increases
  useEffect(() => {
    if (page > 1) {
      fetchGames(page, filters.q, filters.year, filters.genre, true);
    }
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (filters.q) params.q = filters.q;
    if (filters.year) params.year = filters.year;
    if (filters.genre) params.genre = filters.genre;
    setSearchParams(params);
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
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            className="flex-1 w-full p-3 sm:p-4 rounded-full bg-[#303134]/90 backdrop-blur-sm text-[#e8eaed] border border-[#5f6368] focus:outline-none focus:border-[#8ab4f8] text-base sm:text-lg"
          />

          <select
            value={filters.genre}
            onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
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
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
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
          {games.map((game, index) => {
            const releasedYear = game.releasedDate
              ? game.releasedDate.substring(0, 4)
              : "TBA";

            const isLastElement = games.length === index + 1;

            return (
              <div
                key={`game-card-${game.rawgId || game._id}`}
                ref={isLastElement ? lastGameElementRef : null}
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