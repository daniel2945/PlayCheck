import { useState, useEffect } from "react";
import GameCard from "../components/GameCard";

export default function GamesCatalog({ setView, setSelectedGameId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // טעינה ראשונית של משחקים כשהעמוד עולה (כדי שלא יהיה מסך ריק)
  useEffect(() => {
    const fetchDefaultGames = async () => {
      setLoading(true);
      try {
        // שים לב: שינינו ל-game (יחיד)
        const res = await fetch(
          "http://localhost:3000/api/game/search?q=popular",
        );
        const data = await res.json();
        if (data.success) {
          setGames(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch default games:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDefaultGames();
  }, []);

  // פונקציית החיפוש כשלוחצים על הכפתור
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setGames([]);

    try {
      // שים לב: שינינו ל-game (יחיד)
      const res = await fetch(
        `http://localhost:3000/api/game/search?q=${encodeURIComponent(
          searchQuery,
        )}`,
      );

      const contentType = res.headers.get("content-type");
      if (
        !res.ok &&
        (!contentType || !contentType.includes("application/json"))
      ) {
        throw new Error("API route not found or server error");
      }

      const data = await res.json();

      if (data.success) {
        setGames(data.data);
      } else {
        setError(data.message || "Failed to fetch games");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(
        "A network error occurred while searching. Is the backend running?",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGameClick = (game) => {
    const gameId = game.rawgId || game._id;
    console.log("Selected game ID:", gameId);
    // Updates App.jsx state so the Result component knows what to fetch
    setSelectedGameId(gameId);
    setView("result");
  };

  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto min-h-screen flex flex-col items-center">
      <h2 className="text-3xl text-[#e8eaed] mb-8 font-medium">
        Search Games Catalog
      </h2>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="w-full max-w-2xl flex items-center gap-3 mb-12"
      >
        <input
          type="text"
          placeholder="Search for a game (e.g. Grand Theft Auto)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 p-4 rounded-full bg-[#303134] text-[#e8eaed] border border-[#5f6368] focus:outline-none focus:border-[#8ab4f8] transition-colors text-lg shadow-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-4 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] rounded-full font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="text-[#EA4335] bg-[#303134] border border-[#EA4335] px-6 py-3 rounded-lg mb-8 font-medium">
          {error}
        </div>
      )}

      {/* Results Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12">
        {games.map((game, index) => {
          const gameId = game.rawgId || game._id || index;
          const title = game.name || game.title;
          return (
            <div
              key={gameId}
              onClick={() => handleGameClick(game)}
              className="cursor-pointer"
            >
              <GameCard title={title} imageUrl={game.image} setView={setView} />
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && !error && games.length === 0 && searchQuery && (
        <div className="text-[#9aa0a6] text-lg">
          No games found. Try a different search term.
        </div>
      )}
    </div>
  );
}
