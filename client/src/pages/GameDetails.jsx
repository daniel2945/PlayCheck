import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_CALL from "../api/API_CALL";

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

  // תמונת רקע (אם אין, נשים משהו חלופי כהה)
  const heroImage =
    game.background_image ||
    game.image ||
    "https://placehold.co/1920x1080/1a1a1a/ffffff?text=No+Image+Available";

  // עיבוד התאריך המדויק (לפי releasedDate שמגיע מהשרת/מונגו)
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
      {/* אזור ה-Hero (מבנה משופר לטשטוש התחתית ולמניעת חיתוך עליון) */}
      <div className="relative w-full h-[45vh] md:h-[60vh]">
        {/* התמונה עצמה - bg-top מונע חיתוך מלמעלה, והמסכה מטשטשת את התחתית */}
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

        {/* שכבת הכהיה (Gradient) כדי שהטקסט יבלוט */}
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

      {/* אזור התוכן */}
      <div className="px-6 md:px-12 pt-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-12 relative z-20">
        {/* עמודה מרכזית: תיאור */}
        <div className="flex-1">
          <h2 className="text-2xl text-[#8ab4f8] font-bold mb-4 border-b border-[#5f6368] pb-2">
            About the Game
          </h2>

          <div className="text-[#e8eaed] text-lg leading-relaxed space-y-4">
            {/* RAWG מחזיר לפעמים תיאור נקי ב-description_raw ולפעמים HTML ב-description */}
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
        </div>

        {/* עמודה צדדית: פעולות (סטיקי - יורד עם הגלילה) */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          <div className="bg-[#303134] p-6 rounded-2xl border border-[#5f6368] shadow-xl sticky top-24">
            <h3 className="text-[#e8eaed] text-xl font-medium mb-6 text-center">
              Ready to play?
            </h3>

            {/* הכפתור שמנווט לעמוד ה-Result לבדיקת המחשב */}
            <button
              onClick={() => navigate(`/game/${gameId}`)}
              className="w-full py-4 bg-[#34A853] hover:bg-[#2d9047] text-[#202124] rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-[0_0_15px_rgba(52,168,83,0.3)] mb-4"
            >
              Can I Run It?
            </button>

            <button
              onClick={() => navigate("/catalog")}
              className="w-full py-3 border border-[#8ab4f8] text-[#8ab4f8] hover:bg-[#8ab4f8] hover:text-[#202124] rounded-xl font-bold transition-colors"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
