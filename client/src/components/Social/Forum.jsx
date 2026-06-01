import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import API_CALL from "../../api/API_CALL";
import toast from "react-hot-toast";

// פונקציית עזר לחישוב הזמן שעבר
const timeAgo = (dateInput) => {
  const date = new Date(dateInput);
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// פונקציית הקסם להמרת ג'יבריש בעברית לאנגלית (כדי למנוע שגיאת קריסה)
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

// פונקציה לבדיקה אם הפריט נערך
const isEdited = (createdAt, updatedAt) => {
  if (!createdAt || !updatedAt) return false;
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 2000;
};

const Forum = () => {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [image, setImage] = useState({ url: "", publicId: "" });
  const [isUploading, setIsUploading] = useState(false);

  const [showGameSearch, setShowGameSearch] = useState(false);
  const [gameQuery, setGameQuery] = useState("");
  const [gameResults, setGameResults] = useState([]);
  const [isSearchingGames, setIsSearchingGames] = useState(false);
  const [taggedGame, setTaggedGame] = useState(null);

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (gameQuery.trim().length >= 2) {
        setIsSearchingGames(true);
        try {
          const fixedQuery = fixHebrewToEnglish(gameQuery);
          const res = await API_CALL(
            `/api/game/search?q=${encodeURIComponent(fixedQuery)}`,
          );
          if (res.success && res.data) setGameResults(res.data.slice(0, 5));
        } catch (err) {
          console.error("Game search error:", err);
        } finally {
          setIsSearchingGames(false);
        }
      } else {
        setGameResults([]);
      }
    }, 500);
    return () => clearTimeout(searchTimeout);
  }, [gameQuery]);

  const fetchThreads = async () => {
    try {
      const data = await API_CALL("/api/social/threads", "GET");
      setThreads(data);
    } catch (err) {
      toast.error("Failed to load forum");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    setIsUploading(true);
    try {
      const token = localStorage.getItem("token");
      const BASE_URL =
        window.location.hostname === "localhost"
          ? "http://localhost:3000"
          : "https://playcheck.onrender.com";
      const res = await fetch(`${BASE_URL}/api/social/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Upload failed");
      setImage({ url: data.url, publicId: data.publicId });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim())
      return toast.error("Fill in all fields");
    setIsSubmitting(true);
    try {
      const payload = {
        title,
        content,
        category,
        imageUrl: image.url,
        publicId: image.publicId,
        taggedGame: taggedGame
          ? {
              _id: taggedGame._id,
              gameId: taggedGame.gameId || taggedGame._id, // מניעת דריסה של מונגוס
              title: taggedGame.title,
              image: taggedGame.image,
            }
          : null,
      };
      await API_CALL("/api/social/threads", "POST", payload);
      setTitle("");
      setContent("");
      setCategory("General");
      setImage({ url: "", publicId: "" });
      setTaggedGame(null);
      setShowGameSearch(false);
      setShowForm(false);
      toast.success("Thread opened!");
      fetchThreads();
    } catch (err) {
      toast.error("Failed to create thread");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#c58af9]">Forum Discussions</h2>
        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#c58af9] text-[#202124] px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-[#d8a8fa] transition-colors"
          >
            {showForm ? "Cancel" : "+ Create Topic"}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateThread}
          className="bg-[#303134] p-4 rounded-xl border border-[#c58af9]/40 space-y-3 shadow-lg"
        >
          <input
            type="text"
            placeholder="Discussion Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#202124] text-[#e8eaed] rounded-lg p-2 border border-[#5f6368] focus:outline-none focus:border-[#c58af9] font-bold"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[#202124] text-[#e8eaed] rounded-lg p-2 border border-[#5f6368] focus:outline-none focus:border-[#c58af9]"
          >
            <option value="General">General</option>
            <option value="Hardware">Hardware</option>
            <option value="Games">Games</option>
          </select>
          <textarea
            placeholder="What do you want to talk about?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-[#202124] text-[#e8eaed] rounded-lg p-3 border border-[#5f6368] focus:outline-none focus:border-[#c58af9] h-28 resize-none"
          />
          {image.url && (
            <div className="relative rounded-lg overflow-hidden border border-[#5f6368] w-full max-h-40">
              <img
                src={image.url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setImage({ url: "", publicId: "" })}
                className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {showGameSearch && (
            <div className="mt-2 relative animate-fade-in">
              <input
                type="text"
                placeholder="Search a game to tag..."
                value={gameQuery}
                onChange={(e) => setGameQuery(e.target.value)}
                className="w-full bg-[#202124] text-[#e8eaed] rounded-lg p-2 border border-[#5f6368] focus:border-[#c58af9] text-sm outline-none"
                autoFocus
              />
              {isSearchingGames && (
                <div className="absolute right-3 top-2.5 text-xs text-gray-400">
                  Searching...
                </div>
              )}
              {gameResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-[#303134] border border-[#5f6368] rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                  {gameResults.map((game) => (
                    <div
                      key={game._id || game.rawgId}
                      onClick={() => {
                        setTaggedGame({
                          _id: game._id || game.rawgId,
                          title: game.title || game.name,
                          image: game.image || game.background_image,
                        });
                        setShowGameSearch(false);
                        setGameQuery("");
                        setGameResults([]);
                      }}
                      className="flex items-center gap-3 p-2 hover:bg-[#3c4043] cursor-pointer border-b border-[#5f6368]/30 last:border-0"
                    >
                      {game.image || game.background_image ? (
                        <img
                          src={game.image || game.background_image}
                          alt="preview"
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-[#202124] rounded"></div>
                      )}
                      <span className="text-sm text-[#e8eaed]">
                        {game.title || game.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {taggedGame && (
            <div className="mt-2 flex items-center justify-between bg-[#202124] p-2 rounded-lg border border-[#c58af9]/50 animate-fade-in">
              <div className="flex items-center gap-3">
                {taggedGame.image && (
                  <img
                    src={taggedGame.image}
                    alt="preview"
                    className="w-8 h-8 rounded object-cover shadow-sm"
                  />
                )}
                <span className="text-sm font-bold text-[#c58af9]">
                  {taggedGame.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTaggedGame(null)}
                className="text-red-400 text-xs px-2 hover:underline"
              >
                ✕ Remove
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowGameSearch(!showGameSearch)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#c58af9] transition-colors"
              >
                🎮 Tag Game
              </button>
              <label className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#c58af9] cursor-pointer">
                <span>{isUploading ? "Uploading..." : "📷 Attach Image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="bg-[#c58af9] text-[#202124] px-5 py-1.5 rounded-lg font-bold text-sm"
            >
              Publish Topic
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-gray-400">Loading topics...</div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <Link
              key={thread._id}
              to={`/social/thread/${thread._id}`}
              className="block bg-[#303134] p-4 rounded-xl border border-[#5f6368] hover:border-[#c58af9] transition-all group shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-[#c58af9]/10 text-[#c58af9] px-2 py-0.5 rounded-full">
                    {thread.category}
                  </span>
                  {thread.taggedGame && (
                    <span className="text-xs border border-[#c58af9]/30 text-[#c58af9] px-2 py-0.5 rounded-full truncate max-w-[120px]">
                      🎮 {thread.taggedGame.title}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  {timeAgo(thread.createdAt)}
                  {thread.isEdited && (
                    <span className="italic ml-1.5">(edited)</span>
                  )}
                </div>
              </div>
              <h3 className="text-lg font-bold group-hover:text-[#c58af9] transition-colors">
                {thread.title}
              </h3>
              <p className="text-gray-400 text-sm line-clamp-1 mt-1">
                {thread.content}
              </p>
              <div className="mt-4 pt-2 border-t border-[#5f6368]/20 flex justify-between text-xs text-gray-500">
                <span>By: {thread.author?.userName}</span>
                <span>💬 {thread.replies?.length || 0} replies</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Forum;
