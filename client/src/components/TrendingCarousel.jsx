import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import API_CALL from "../api/API_CALL";

// ייבוא קבצי העיצוב של Swiper
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function TrendingCarousel() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrendingGames = async () => {
      try {
        setLoading(true);
        // מביא משחקים פופולריים מהשנה האחרונה/נוכחית וממיין לפי הדירוג הגבוה ביותר
        const currentYear = new Date().getFullYear();
        const res = await API_CALL(
          `/api/game/search?year=${currentYear}&sort=-rating`,
        );

        if (res.success && res.data) {
          setGames(res.data.slice(0, 10)); // נציג את ה-10 המובילים בקרוסלה
        }
      } catch (error) {
        console.error("Error fetching trending games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingGames();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (games.length === 0) return null;

  return (
    <div className="w-full py-8">
      <h2 className="text-2xl font-bold text-[#e8eaed] mb-6 px-4 sm:px-8">
        🔥 Trending & Highly Rated
      </h2>

      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true, dynamicBullets: true }}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        breakpoints={{
          640: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
        }}
        className="px-4 sm:px-8 pb-12"
      >
        {games.map((game) => (
          <SwiperSlide key={game._id}>
            <div
              onClick={() => navigate(`/details/${game._id}`)}
              className="bg-[#28292c] rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-[#8ab4f8]/50 transition-all group shadow-lg h-full flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#202124] to-transparent opacity-90"></div>
              </div>

              <div className="p-4 flex-grow flex flex-col justify-between">
                <h3 className="text-lg font-bold text-white group-hover:text-[#8ab4f8] transition-colors line-clamp-1">
                  {game.title}
                </h3>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-[#9aa0a6] font-medium">
                    {game.releasedDate
                      ? new Date(game.releasedDate).getFullYear()
                      : "TBA"}
                  </span>
                  {game.metacritic && (
                    <span className="px-2.5 py-1 bg-[#34A853]/10 border border-[#34A853]/30 text-[#34A853] text-xs font-bold rounded-lg shadow-sm">
                      {game.metacritic}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
