import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_CALL from "../api/API_CALL";
import GameReviews from "../components/GameReviews"; 

export default function GameDetails() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await API_CALL(`/api/game/search/${gameId}`);
        if (data.success) {
          setGame(data.data);
        } else {
          setError("Could not load game details.");
        }
      } catch (err) {
        console.error("Error fetching game:", err);
        setError("Network error. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGameData();
    }
  }, [gameId]);

  const scrollToReviews = () => {
    const reviewsSection = document.getElementById("reviews-section");
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 bg-[#202124]">
        <div className="w-16 h-16 border-4 border-[#8ab4f8] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl text-[#e8eaed]">Loading game details...</h2>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 px-4 text-center bg-[#202124]">
        <div className="bg-[#303134] border border-[#EA4335] text-[#EA4335] p-6 rounded-xl max-w-lg mb-8 shadow-lg">
          <p className="text-lg font-medium">{error || "Game not found."}</p>
        </div>
        <button
          onClick={() => navigate("/catalog")}
          className="px-8 py-3 bg-[#8ab4f8] text-[#202124] rounded-full font-bold hover:bg-[#aecbfa]"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  const heroImage =
    game.background_image ||
    game.image ||
    "https://placehold.co/1920x1080/1a1a1a/ffffff?text=No+Image+Available";

  const rawDate = game.releasedDate;
  const releasedDate =
    rawDate && rawDate !== "TBA"
      ? new Date(rawDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Released Date TBA";

  return (
    <div className="min-h-screen bg-[#202124] pb-12">
      <div className="relative w-full h-[45vh] md:h-[60vh]">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-top"
          style={{
            backgroundImage: `url(${heroImage})`,
            WebkitMaskImage:
              "linear-gradient(to bottom, black 40%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, black 40%, transparent 100%)",
          }}
        ></div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#202124] via-[#202124]/50 to-transparent"></div>

        <div className="absolute bottom-0 left-0 w-full px-6 md:px-12 pb-8 max-w-7xl mx-auto z-10">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-[#e8eaed] mb-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            {game.name || game.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[#9aa0a6] text-sm sm:text-lg font-medium drop-shadow-md">
            <span>{releasedDate}</span>

            {game.metacritic && (
              <span className="bg-[#34A853]/20 text-[#34A853] px-3 py-1 rounded-full border border-[#34A853]/50">
                Metacritic: {game.metacritic}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 pt-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-12 relative z-20">
        
        {/* עמודה מרכזית - התוכן עצמו */}
        {/* שינוי למובייל: order-2 כדי שיופיע אחרי התפריט במסכים קטנים */}
        <div className="flex-1 order-2 md:order-1">
          <h2 className="text-2xl text-[#8ab4f8] font-bold mb-4 border-b border-[#5f6368]/30 pb-2">
            About the Game
          </h2>

          <div className="text-[#e8eaed] text-lg leading-relaxed space-y-4">
            {game.description_raw ? (
              <p className="whitespace-pre-line">{game.description_raw}</p>
            ) : (
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    game.description ||
                    "No description available for this game.",
                }}
              />
            )}
          </div>

          <div id="reviews-section" className="mt-16 pt-8 border-t border-[#5f6368]/30">
            <h2 className="text-2xl text-[#8ab4f8] font-bold mb-2">
              Hardware-Matched Reviews
            </h2>
            <p className="text-[#9aa0a6] mb-8">
              See how this game runs for players with a PC setup similar to yours!
            </p>
            
            <GameReviews gameId={gameId} />
            
          </div>
        </div>

        {/* עמודה צדדית - תפריט הכפתורים */}
        {/* שינוי למובייל: order-1 כדי שיופיע ראשון במסכים קטנים */}
        <div className="w-full md:w-80 flex flex-col gap-6 order-1 md:order-2">
          <div className="bg-[#28292c] p-6 rounded-2xl border border-white/5 shadow-2xl sticky top-24">
            <h3 className="text-[#e8eaed] text-xl font-bold mb-6 text-center">
              Ready to play?
            </h3>

            <button
              onClick={() => navigate(`/game/${gameId}`)}
              className="w-full py-4 bg-[#34A853] hover:bg-[#2d9047] text-[#202124] rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-[0_0_15px_rgba(52,168,83,0.3)] mb-4"
            >
              Can I Run It?
            </button>

            <button
              onClick={scrollToReviews}
              className="w-full py-3 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] rounded-xl font-bold transition-colors mb-4 flex items-center justify-center gap-2 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              Read / Write Reviews
            </button>

            <button
              onClick={() => navigate("/catalog")}
              className="w-full py-3 border border-white/10 text-[#9aa0a6] hover:bg-white/5 hover:text-[#e8eaed] rounded-xl font-bold transition-colors"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}