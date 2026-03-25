import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import API_CALL from "../api/API_CALL";

export default function Profile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [specs, setSpecs] = useState(null);

  // הסטייט להיסטוריית חיפושים
  const [searchHistory, setSearchHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // הסטייט למשחקים מומלצים
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // משיכת המחשב השמור מתוך ה-Store
  useEffect(() => {
    if (user && user.myPc && user.myPc.cpuId && user.myPc.gpuId) {
      setSpecs({
        cpu: user.myPc.cpuId,
        gpu: user.myPc.gpuId,
        ram: user.myPc.ramGb,
      });
    } else {
      setSpecs(null);
    }
  }, [user]);

  // משיכת היסטוריית החיפושים ומשחקים מומלצים מהשרת
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await API_CALL("/api/user/history");
        if (data.success) {
          setSearchHistory(data.data);
        }
      } catch (error) {
        console.error("Failed to load search history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    const fetchRecommendations = async () => {
      try {
        const data = await API_CALL("/api/user/recommendations");
        if (data.success) {
          setRecommendations(data.data);
        }
      } catch (error) {
        console.error("Failed to load recommendations:", error);
      } finally {
        setLoadingRecs(false);
      }
    };

    if (user) {
      fetchHistory();
      fetchRecommendations();
    }
  }, [user]);

  // פונקציה חכמה שמונעת כפילות בשם המותג
  const getHardwareName = (hardware) => {
    if (!hardware || typeof hardware !== "object") return "Not Set";

    const brand = hardware.brand || "";
    const model = hardware.model || "";

    if (!brand) return model;
    if (!model) return brand;

    return model.toLowerCase().startsWith(brand.toLowerCase())
      ? model
      : `${brand} ${model}`;
  };

  // ✨ התיקון: פונקציה שמחשבת זמן יחסי ("לפני 5 דקות", "אתמול" וכו') ✨
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60)
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;

    // אם עבר יותר משבוע, נציג תאריך רגיל
    return date.toLocaleDateString();
  };

  const handleGameClick = (gameId) => {
    navigate(`/details/${gameId}`);
  };

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12 max-w-4xl mx-auto space-y-8 min-h-screen w-full">
      <h2 className="text-2xl sm:text-3xl text-[#e8eaed] font-medium border-b border-[#303134] pb-4 text-center sm:text-left">
        Hello,{" "}
        <span className="text-[#8ab4f8]">{user?.userName || "Gamer"}</span>
      </h2>

      {/* Hardware Specs Section */}
      <div className="bg-[#303134] border border-[#5f6368] rounded-xl p-5 sm:p-6 shadow-lg">
        <h3 className="text-xl text-[#8ab4f8] mb-4">My Computer Specs</h3>

        {specs ? (
          <div className="space-y-3 text-[#e8eaed] text-lg">
            <p className="flex items-center">
              <span className="text-[#9aa0a6] font-medium w-20">CPU:</span>
              <span className="bg-[#202124] px-3 py-1 rounded-md border border-[#5f6368]">
                {getHardwareName(specs.cpu)}
              </span>
            </p>
            <p className="flex items-center">
              <span className="text-[#9aa0a6] font-medium w-20">GPU:</span>
              <span className="bg-[#202124] px-3 py-1 rounded-md border border-[#5f6368]">
                {getHardwareName(specs.gpu)}
              </span>
            </p>
            <p className="flex items-center">
              <span className="text-[#9aa0a6] font-medium w-20">RAM:</span>
              <span className="bg-[#202124] px-3 py-1 rounded-md border border-[#5f6368]">
                {specs.ram} GB
              </span>
            </p>

            <div className="mt-6 pt-4 border-t border-[#5f6368]">
              <Link
                to="/setup"
                className="text-sm text-[#8ab4f8] hover:text-[#aecbfa] transition-colors"
              >
                Update Specs
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="text-[#9aa0a6]">
              You haven't saved your PC specs yet.
            </p>
            <Link
              to="/setup"
              className="bg-[#8ab4f8] text-[#202124] px-6 py-2 rounded-full font-bold hover:bg-[#aecbfa] transition-colors"
            >
              Set Up My PC
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Recommended Games */}
        <div className="bg-[#303134] border border-[#5f6368] rounded-xl p-6 shadow-lg min-h-[250px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl text-[#8ab4f8]">Recommended Games</h3>
          </div>

          <div className="flex-grow">
            {loadingRecs ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-8 h-8 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((game, index) => (
                  <div
                    key={`rec-${game._id}-${index}`}
                    onClick={() => handleGameClick(game._id)}
                    className="flex items-center gap-4 bg-[#202124] p-2 rounded-lg border border-[#5f6368] cursor-pointer hover:bg-[#3c4043] transition-colors"
                  >
                    {game.image ? (
                      <img
                        src={game.image}
                        alt={game.title}
                        className="w-16 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-10 bg-[#303134] rounded flex items-center justify-center text-[#5f6368] text-xs">
                        No img
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[#e8eaed] font-medium truncate text-sm">
                        {game.title}
                      </p>
                      {game.metacritic && (
                        <p className="text-[#34A853] text-xs font-bold">
                          Metacritic: {game.metacritic}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center mt-6">
                <svg
                  className="w-12 h-12 text-[#5f6368] mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <p className="text-[#9aa0a6] text-sm">
                  No specific recommendations yet.
                </p>
                <p className="text-[#9aa0a6] text-xs mt-1">
                  Make sure your PC specs are up to date.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Search History */}
        <div className="bg-[#303134] border border-[#5f6368] rounded-xl p-6 shadow-lg min-h-[250px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl text-[#8ab4f8]">Recent Checks</h3>
          </div>

          <div className="flex-grow">
            {loadingHistory ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-8 h-8 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : searchHistory.length > 0 ? (
              <div className="space-y-3">
                {searchHistory.map((item, index) => (
                  <div
                    key={`${item._id}-${index}`}
                    onClick={() => handleGameClick(item._id)}
                    className="flex items-center gap-4 bg-[#202124] p-2 rounded-lg border border-[#5f6368] cursor-pointer hover:bg-[#3c4043] transition-colors"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-16 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-10 bg-[#303134] rounded flex items-center justify-center text-[#5f6368] text-xs">
                        No img
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[#e8eaed] font-medium truncate text-sm">
                        {item.title}
                      </p>

                      {/* ✨ שימוש בפונקציה החדשה במקום התאריך המלא ✨ */}
                      <p className="text-[#9aa0a6] text-xs">
                        {getTimeAgo(item.searchedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center mt-6">
                <svg
                  className="w-12 h-12 text-[#5f6368] mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <p className="text-[#9aa0a6] text-sm">
                  Your search history is empty.
                </p>
                <Link
                  to="/catalog"
                  className="text-[#8ab4f8] text-sm mt-2 hover:underline"
                >
                  Browse games
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
