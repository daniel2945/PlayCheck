import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import API_CALL from "../api/API_CALL";
import toast from "react-hot-toast";
import ReportButton from "../components/ReportButton";

// פונקציית עזר לזמנים
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

// פונקציה לבדיקה אם הפריט נערך
const isEdited = (createdAt, updatedAt) => {
  if (!createdAt || !updatedAt) return false;
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 2000;
};

// פונקציית הקסם להמרת ג'יבריש בעברית לאנגלית
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

const EditIcon = () => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);
const DeleteIcon = () => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
const ShareIcon = () => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
);

// פונקציה לזיהוי והפיכת טקסט לקישור פעיל
const renderContentWithLinks = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return (
    <span className="whitespace-pre-wrap">
      {text.split(urlRegex).map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c58af9] hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </span>
  );
};

// פונקציית עזר לניקוי כפילויות בשם חומרה
const cleanHardwareName = (name) => {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length > 1 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
    return parts.slice(1).join(" ");
  }
  return name;
};

const ThreadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);

  // הוספת תגובה עם תמונה לאשכול
  const [replyContent, setReplyContent] = useState("");
  const [replyImage, setReplyImage] = useState({ url: "", publicId: "" });
  const [isUploadingReply, setIsUploadingReply] = useState(false);

  const [editingReply, setEditingReply] = useState(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [editReplyImage, setEditReplyImage] = useState({
    url: "",
    publicId: "",
  });
  const [isUploadingEditReply, setIsUploadingEditReply] = useState(false);

  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editThreadTitle, setEditThreadTitle] = useState("");
  const [editThreadContent, setEditThreadContent] = useState("");
  const [editThreadCategory, setEditThreadCategory] = useState("");
  const [editThreadImage, setEditThreadImage] = useState({
    url: "",
    publicId: "",
  });
  const [isUploadingThread, setIsUploadingThread] = useState(false);

  // מצבי תיוג בעריכה
  const [editThreadTaggedGame, setEditThreadTaggedGame] = useState(null);
  const [editShowGameSearch, setEditShowGameSearch] = useState(false);
  const [editGameQuery, setEditGameQuery] = useState("");
  const [editGameResults, setEditGameResults] = useState([]);
  const [editIsSearchingGames, setEditIsSearchingGames] = useState(false);

  useEffect(() => {
    fetchThreadDetails();
  }, [id]);

  const fetchThreadDetails = async () => {
    try {
      const allThreads = await API_CALL("/api/social/threads", "GET");
      const currentThread = allThreads.find((t) => t._id === id);
      if (!currentThread) {
        toast.error("Thread not found");
        navigate("/social");
        return;
      }
      setThread(currentThread);
    } catch (err) {
      toast.error("Error loading thread");
    } finally {
      setLoading(false);
    }
  };

  // חיפוש משחק למצב עריכה
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (editGameQuery.trim().length >= 2) {
        setEditIsSearchingGames(true);
        try {
          const fixedQuery = fixHebrewToEnglish(editGameQuery);
          const res = await API_CALL(
            `/api/game/search?q=${encodeURIComponent(fixedQuery)}`,
          );
          if (res.success && res.data) setEditGameResults(res.data.slice(0, 5));
        } catch (err) {
          console.error("Game edit search error:", err);
        } finally {
          setEditIsSearchingGames(false);
        }
      } else {
        setEditGameResults([]);
      }
    }, 500);
    return () => clearTimeout(searchTimeout);
  }, [editGameQuery]);

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
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
    return data;
  };

  // פונקציית העלאת תמונה דינמית (לתגובות, לעריכות וכו')
  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === "thread") setIsUploadingThread(true);
    if (type === "reply") setIsUploadingReply(true);
    if (type === "editReply") setIsUploadingEditReply(true);

    try {
      const data = await uploadToCloudinary(file);
      if (type === "thread")
        setEditThreadImage({ url: data.url, publicId: data.publicId });
      if (type === "reply")
        setReplyImage({ url: data.url, publicId: data.publicId });
      if (type === "editReply")
        setEditReplyImage({ url: data.url, publicId: data.publicId });
    } catch (err) {
      toast.error(err.message);
    } finally {
      if (type === "thread") setIsUploadingThread(false);
      if (type === "reply") setIsUploadingReply(false);
      if (type === "editReply") setIsUploadingEditReply(false);
    }
  };

  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    try {
      await API_CALL(`/api/social/threads/${id}/replies`, "POST", {
        content: replyContent,
        image: replyImage,
      });
      setReplyContent("");
      setReplyImage({ url: "", publicId: "" });
      fetchThreadDetails();
    } catch (err) {}
  };

  const handleDeleteThread = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-medium text-[#e8eaed]">
            Are you sure you want to delete this thread?
          </p>
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-sm text-[#9aa0a6] hover:bg-[#3c4043] rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await API_CALL(`/api/social/threads/${id}`, "DELETE");
                  toast.success("Thread deleted successfully");
                  navigate("/social");
                } catch (err) {
                  toast.error("Delete failed");
                }
              }}
              className="px-3 py-1.5 text-sm bg-[#EA4335] text-white rounded hover:bg-[#c5221f] transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  const handleEditThreadSubmit = async () => {
    if (!editThreadTitle.trim() || !editThreadContent.trim()) return;
    try {
      await API_CALL(`/api/social/threads/${id}`, "PUT", {
        title: editThreadTitle,
        content: editThreadContent,
        category: editThreadCategory,
        image: editThreadImage,
        taggedGame: editThreadTaggedGame
          ? {
              _id: editThreadTaggedGame.gameId || editThreadTaggedGame._id,
              gameId: editThreadTaggedGame.gameId || editThreadTaggedGame._id,
              title: editThreadTaggedGame.title,
              image: editThreadTaggedGame.image,
            }
          : null,
      });
      setThread({
        ...thread,
        title: editThreadTitle,
        content: editThreadContent,
        category: editThreadCategory,
        image: editThreadImage,
        taggedGame: editThreadTaggedGame,
        isEdited: true,
      });
      setIsEditingThread(false);
      toast.success("Updated");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleEditReplySubmit = async (replyId) => {
    if (!editReplyText.trim()) return;
    try {
      await API_CALL(`/api/social/threads/${id}/replies/${replyId}`, "PUT", {
        content: editReplyText,
        image: editReplyImage,
      });
      setEditingReply(null);
      fetchThreadDetails();
      toast.success("Reply updated");
    } catch (err) {
      toast.error("Edit failed");
    }
  };

  const handleDeleteReply = (replyId) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-medium text-[#e8eaed]">
            Are you sure you want to delete this reply?
          </p>
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-sm text-[#9aa0a6] hover:bg-[#3c4043] rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await API_CALL(
                    `/api/social/admin/threads/${id}/replies/${replyId}`,
                    "DELETE",
                  );
                  fetchThreadDetails();
                  toast.success("Reply deleted successfully");
                } catch (err) {
                  toast.error("Delete failed");
                }
              }}
              className="px-3 py-1.5 text-sm bg-[#EA4335] text-white rounded hover:bg-[#c5221f] transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Thread link copied to clipboard!");
  };

  if (loading)
    return <div className="pt-32 text-center text-gray-400">Loading...</div>;
  if (!thread) return null;

  const isAdmin = user && (user.role === "admin" || user.role === "owner");
  const isThreadAuthor = user && user._id === thread.author?._id;
  const canEditThread = isThreadAuthor || isAdmin; // ✨ הוספת הרשאת עריכה למנהל באשכול ✨

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pt-24 min-h-screen w-full">
      <div className="flex justify-between items-center mb-4">
        <Link
          to="/social"
          className="text-sm text-[#c58af9] hover:text-[#d8a8fa] font-semibold inline-flex items-center gap-1 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>{" "}
          Back to Hub
        </Link>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-white transition-colors bg-[#303134] px-3 py-1.5 rounded-lg border border-[#5f6368]"
        >
          <ShareIcon /> Share Thread
        </button>
      </div>

      <div className="bg-[#303134] rounded-xl p-6 border border-[#5f6368] shadow-md mb-6 relative">
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {canEditThread && !isEditingThread && (
            <button
              onClick={() => {
                setIsEditingThread(true);
                setEditThreadTitle(thread.title);
                setEditThreadContent(thread.content);
                setEditThreadCategory(thread.category);
                setEditThreadImage(thread.image || { url: "", publicId: "" });
                setEditThreadTaggedGame(thread.taggedGame || null);
                setEditShowGameSearch(false);
              }}
              className="flex items-center gap-1 text-gray-400 hover:text-white bg-[#202124] px-2.5 py-1.5 rounded-lg text-xs transition-colors"
            >
              <EditIcon /> Edit
            </button>
          )}
          {(isThreadAuthor || isAdmin) && !isEditingThread && (
            <button
              onClick={handleDeleteThread}
              className="flex items-center gap-1 text-gray-400 hover:text-red-400 bg-[#202124] px-2.5 py-1.5 rounded-lg text-xs transition-colors"
            >
              <DeleteIcon /> Delete
            </button>
          )}
          {user && !isThreadAuthor && !isAdmin && !isEditingThread && (
            <div className="flex items-center gap-1 text-gray-400 bg-[#202124] px-1.5 py-1 rounded-lg text-xs">
              <ReportButton entityId={thread._id} entityType="thread" />
            </div>
          )}
        </div>

        {isEditingThread ? (
          <div className="mt-2 w-full bg-[#202124] p-4 rounded-xl border border-[#c58af9]/50">
            <select
              value={editThreadCategory}
              onChange={(e) => setEditThreadCategory(e.target.value)}
              className="bg-[#303134] text-[#c58af9] px-3 py-1 rounded-full text-sm mb-3 outline-none border border-[#5f6368]"
            >
              <option value="General">General</option>
              <option value="Hardware">Hardware</option>
              <option value="Games">Games</option>
            </select>
            <input
              type="text"
              value={editThreadTitle}
              onChange={(e) => setEditThreadTitle(e.target.value)}
              className="w-full bg-transparent text-white border-b border-[#5f6368] font-bold text-2xl mb-4 pb-2 focus:border-[#c58af9] outline-none"
              placeholder="Title..."
            />
            <textarea
              value={editThreadContent}
              onChange={(e) => setEditThreadContent(e.target.value)}
              className="w-full bg-[#303134] text-gray-200 p-3 rounded-lg border border-[#5f6368] min-h-[120px] mb-3 focus:border-[#c58af9] outline-none resize-none"
              placeholder="Content..."
            />

            {editThreadImage.url && (
              <div className="relative mb-4 rounded-lg overflow-hidden border border-[#5f6368] inline-block max-w-sm">
                <img
                  src={editThreadImage.url}
                  alt="Preview"
                  className="w-full object-cover"
                />
                <button
                  onClick={() => setEditThreadImage({ url: "", publicId: "" })}
                  className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {editThreadTaggedGame && (
              <div className="mt-2 mb-3 flex items-center justify-between bg-black/40 p-2 rounded-lg border border-[#c58af9]/50 animate-fade-in">
                <div className="flex items-center gap-3">
                  {editThreadTaggedGame.image && (
                    <img
                      src={editThreadTaggedGame.image}
                      alt="preview"
                      className="w-8 h-8 rounded object-cover shadow-sm"
                    />
                  )}
                  <span className="text-sm font-bold text-[#c58af9]">
                    {editThreadTaggedGame.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditThreadTaggedGame(null)}
                  className="text-red-400 text-xs px-2 hover:underline"
                >
                  ✕ Remove
                </button>
              </div>
            )}

            {editShowGameSearch && (
              <div className="mt-2 mb-3 relative animate-fade-in">
                <input
                  type="text"
                  placeholder="Search a game to tag..."
                  value={editGameQuery}
                  onChange={(e) => setEditGameQuery(e.target.value)}
                  className="w-full bg-[#1e1e20] text-[#e8eaed] rounded-lg p-2 border border-[#5f6368] focus:border-[#c58af9] text-sm outline-none"
                  autoFocus
                />
                {editIsSearchingGames && (
                  <div className="absolute right-3 top-2.5 text-xs text-gray-400">
                    Searching...
                  </div>
                )}
                {editGameResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-[#303134] border border-[#5f6368] rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                    {editGameResults.map((game) => (
                      <div
                        key={game._id || game.rawgId}
                        onClick={() => {
                          setEditThreadTaggedGame({
                            _id: game._id || game.rawgId,
                            gameId: game._id || game.rawgId,
                            title: game.title || game.name,
                            image: game.image || game.background_image,
                          });
                          setEditShowGameSearch(false);
                          setEditGameQuery("");
                          setEditGameResults([]);
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

            <div className="flex justify-between items-center border-t border-[#5f6368] pt-3">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setEditShowGameSearch(!editShowGameSearch)}
                  className="text-sm text-gray-400 hover:text-[#c58af9] flex items-center gap-1 transition-colors"
                >
                  🎮 Tag Game
                </button>
                <label className="text-sm text-[#c58af9] cursor-pointer flex items-center gap-1">
                  📷{" "}
                  {isUploadingThread
                    ? "..."
                    : editThreadImage.url
                      ? "Change Image"
                      : "Add Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "thread")}
                    className="hidden"
                    disabled={isUploadingThread}
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingThread(false)}
                  className="text-gray-400 text-sm hover:text-white px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditThreadSubmit}
                  disabled={isUploadingThread}
                  className="bg-[#c58af9] text-[#202124] px-5 py-1.5 rounded-lg font-bold text-sm hover:bg-[#d8a8fa]"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="pr-20">
            <span className="text-xs bg-[#c58af9]/20 text-[#c58af9] px-2.5 py-1 rounded-full font-medium mb-3 inline-block">
              {thread.category}
            </span>
            <h1 className="text-3xl font-bold text-white mb-1">
              {thread.title}
            </h1>
            <p className="text-xs text-gray-500 mb-4 flex items-center">
              By{" "}
              <span className="text-gray-300 ml-1">
                {thread.author?.userName}
              </span>{" "}
              <span className="mx-1.5">•</span> {timeAgo(thread.createdAt)}
              {thread.isEdited && (
                <span className="italic ml-1.5">(edited)</span>
              )}
            </p>
            <p className="text-gray-200 text-[15px] whitespace-pre-wrap leading-relaxed">
              {renderContentWithLinks(thread.content)}
            </p>
            {thread.image?.url && (
              <div className="mt-5 rounded-lg overflow-hidden border border-[#5f6368]">
                <img
                  src={thread.image.url}
                  alt="Thread attached"
                  className="w-full max-h-[500px] object-contain bg-black"
                />
              </div>
            )}

            {thread.taggedGame && (
              <Link
                to={`/details/${thread.taggedGame.gameId || thread.taggedGame._id}`}
                className="mt-6 flex flex-col bg-[#202124] rounded-lg overflow-hidden border border-[#5f6368] hover:border-[#c58af9] transition-all max-w-sm cursor-pointer block"
              >
                {thread.taggedGame.image ? (
                  <div className="w-full h-48 bg-black overflow-hidden">
                    <img
                      src={thread.taggedGame.image}
                      alt="Game Preview"
                      className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-[#303134] flex items-center justify-center text-[#5f6368]">
                    No Image
                  </div>
                )}
                <div className="p-3 bg-[#303134]">
                  <h4 className="font-bold text-[#e8eaed] text-[15px] mb-1">
                    {thread.taggedGame.title}
                  </h4>
                  <div className="text-xs text-[#9aa0a6] mb-2">
                    PlayCheck Game Database
                  </div>
                  <div className="text-[11px] text-[#c58af9] font-bold uppercase tracking-wide">
                    View Details →
                  </div>
                </div>
              </Link>
            )}

            {thread.hardwareSnapshot && (
              <div className="mt-5 flex flex-wrap gap-2.5 bg-[#202124] p-3 rounded-xl border border-[#5f6368]/50 shadow-inner w-full max-w-2xl">
                <span className="px-3 py-1.5 bg-[#303134] border border-[#5f6368] rounded-lg text-xs font-medium text-[#c58af9] shadow-sm flex items-center gap-1.5">
                  <span className="text-[14px]">💻</span> CPU:{" "}
                  {cleanHardwareName(thread.hardwareSnapshot.cpuName)}
                </span>
                <span className="px-3 py-1.5 bg-[#303134] border border-[#5f6368] rounded-lg text-xs font-medium text-[#c58af9] shadow-sm flex items-center gap-1.5">
                  <span className="text-[14px]">🎮</span> GPU:{" "}
                  {cleanHardwareName(thread.hardwareSnapshot.gpuName)}
                </span>
                <span className="px-3 py-1.5 bg-[#303134] border border-[#5f6368] rounded-lg text-xs font-medium text-[#c58af9] shadow-sm flex items-center gap-1.5">
                  <span className="text-[14px]">💾</span> RAM:{" "}
                  {thread.hardwareSnapshot.ramGb}GB
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-bold text-gray-300">
          Replies ({thread.replies?.length || 0})
        </h3>
        {thread.replies?.map((reply) => {
          const isReplyAuthor =
            user &&
            (user._id === reply.author?._id || reply.author === user?._id);
          const canEditReply = isReplyAuthor || isAdmin; // ✨ הרשאת עריכה למנהל בתגובה באשכול ✨
          const isEditing = editingReply === reply._id;

          return (
            <div
              key={reply._id}
              className="bg-[#202124] rounded-xl p-4 border border-[#5f6368]/60 ml-6 group"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-[#c58af9]">
                  {reply.author?.userName}
                </span>
                <span className="text-[10px] text-gray-500 flex items-center">
                  {isEdited(reply.createdAt, reply.updatedAt) && (
                    <span className="italic mr-1.5">(edited)</span>
                  )}
                  {timeAgo(reply.createdAt)}
                </span>
              </div>

              {isEditing ? (
                <div className="mt-2 bg-[#303134] p-3 rounded-lg border border-[#5f6368]">
                  <textarea
                    value={editReplyText}
                    onChange={(e) => setEditReplyText(e.target.value)}
                    className="w-full bg-transparent text-white mb-2 text-sm h-20 outline-none focus:border-[#c58af9] resize-none"
                  />

                  {editReplyImage.url && (
                    <div className="relative mb-3 rounded-lg overflow-hidden border border-[#5f6368] inline-block max-w-[200px]">
                      <img
                        src={editReplyImage.url}
                        alt="Preview"
                        className="w-full object-cover"
                      />
                      <button
                        onClick={() =>
                          setEditReplyImage({ url: "", publicId: "" })
                        }
                        className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-[#5f6368] pt-2">
                    <label className="text-xs text-[#c58af9] cursor-pointer flex items-center gap-1">
                      📷{" "}
                      {isUploadingEditReply
                        ? "..."
                        : editReplyImage.url
                          ? "Change Image"
                          : "Add Image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "editReply")}
                        className="hidden"
                        disabled={isUploadingEditReply}
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingReply(null)}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditReplySubmit(reply._id)}
                        disabled={isUploadingEditReply}
                        className="text-xs bg-[#c58af9] text-[#202124] px-3 py-1.5 rounded font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {renderContentWithLinks(reply.content)}
                  </p>
                  {reply.image?.url && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-[#5f6368] max-w-md">
                      <img
                        src={reply.image.url}
                        alt="Reply attached"
                        className="w-full object-cover"
                      />
                    </div>
                  )}

                  {reply.hardwareSnapshot && (
                    <div className="mt-3 flex flex-wrap gap-2 bg-[#1a1b1e] p-2 rounded-lg border border-[#5f6368]/40 shadow-inner w-fit">
                      <span className="px-2 py-1 bg-[#202124] border border-[#5f6368]/50 rounded text-[11px] font-medium text-[#9aa0a6] shadow-sm flex items-center gap-1">
                        💻 {cleanHardwareName(reply.hardwareSnapshot.cpuName)}
                      </span>
                      <span className="px-2 py-1 bg-[#202124] border border-[#5f6368]/50 rounded text-[11px] font-medium text-[#9aa0a6] shadow-sm flex items-center gap-1">
                        🎮 {cleanHardwareName(reply.hardwareSnapshot.gpuName)}
                      </span>
                      <span className="px-2 py-1 bg-[#202124] border border-[#5f6368]/50 rounded text-[11px] font-medium text-[#9aa0a6] shadow-sm flex items-center gap-1">
                        💾 {reply.hardwareSnapshot.ramGb}GB
                      </span>
                    </div>
                  )}
                </>
              )}

              {!isEditing && user && (
                <div className="flex gap-4 text-xs text-gray-500 mt-3 pt-2 border-t border-[#5f6368]/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canEditReply && (
                    <button
                      onClick={() => {
                        setEditingReply(reply._id);
                        setEditReplyText(reply.content);
                        setEditReplyImage(
                          reply.image || { url: "", publicId: "" },
                        );
                      }}
                      className="hover:text-white flex items-center gap-1"
                    >
                      <EditIcon /> Edit
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteReply(reply._id)}
                      className="hover:text-red-400 flex items-center gap-1"
                    >
                      <DeleteIcon /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {user && (
        <form
          onSubmit={handleAddReply}
          className="bg-[#303134] rounded-xl p-4 border border-[#5f6368]"
        >
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="w-full bg-[#202124] text-[#e8eaed] rounded-lg p-3 border border-[#5f6368] focus:outline-none focus:border-[#c58af9] resize-none h-24 text-sm mb-3"
          />

          {replyImage.url && (
            <div className="relative mb-3 rounded-lg overflow-hidden border border-[#5f6368] inline-block max-w-[200px]">
              <img
                src={replyImage.url}
                alt="Preview"
                className="w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setReplyImage({ url: "", publicId: "" })}
                className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-[#5f6368]/50 pt-3">
            <label className="text-sm text-[#c58af9] cursor-pointer flex items-center gap-1">
              📷 {isUploadingReply ? "Uploading..." : "Attach Image"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "reply")}
                className="hidden"
                disabled={isUploadingReply}
              />
            </label>
            <button
              type="submit"
              disabled={!replyContent.trim() || isUploadingReply}
              className="bg-[#c58af9] text-[#202124] px-5 py-1.5 rounded-lg font-bold text-sm hover:bg-[#d8a8fa]"
            >
              Reply
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ThreadDetails;
