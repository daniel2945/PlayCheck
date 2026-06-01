import { useState, useEffect } from "react";
import useAuthStore from "../../store/useAuthStore";
import API_CALL from "../../api/API_CALL";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ReportButton from "../ReportButton";

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

// פונקציה לבדיקה אם הפריט נערך (הפרש של יותר משתי שניות בין היצירה לעדכון)
const isEdited = (createdAt, updatedAt) => {
  if (!createdAt || !updatedAt) return false;
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 2000;
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
              className="text-[#8ab4f8] hover:underline break-all"
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

const Feed = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState("");
  const [image, setImage] = useState({ url: "", publicId: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeComments, setActiveComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostImage, setEditPostImage] = useState({ url: "", publicId: "" });

  // מצבי תיוג בעריכה
  const [editPostTaggedGame, setEditPostTaggedGame] = useState(null);
  const [editShowGameSearch, setEditShowGameSearch] = useState(false);
  const [editGameQuery, setEditGameQuery] = useState("");
  const [editGameResults, setEditGameResults] = useState([]);
  const [editIsSearchingGames, setEditIsSearchingGames] = useState(false);

  // מצבי תיוג משחק
  const [showGameSearch, setShowGameSearch] = useState(false);
  const [gameQuery, setGameQuery] = useState("");
  const [gameResults, setGameResults] = useState([]);
  const [isSearchingGames, setIsSearchingGames] = useState(false);
  const [taggedGame, setTaggedGame] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  // אפקט לגלילה אוטומטית לפוסט במידה וזה הגיע משיתוף
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("postId");
    if (postId && posts.length > 0) {
      const element = document.getElementById(`post-${postId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add(
            "ring-2",
            "ring-[#8ab4f8]",
            "transition-all",
            "duration-1000",
          );
          setTimeout(
            () => element.classList.remove("ring-2", "ring-[#8ab4f8]"),
            2500,
          );
        }, 300);
      }
    }
  }, [posts]);

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

  const fetchPosts = async () => {
    try {
      const data = await API_CALL("/api/social/posts", "GET");
      setPosts(data);
    } catch (error) {
      toast.error("Failed to fetch feed");
    } finally {
      setLoading(false);
    }
  };

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

  const handleImageUpload = async (e, isEditMode = false) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const data = await uploadToCloudinary(file);
      if (isEditMode)
        setEditPostImage({ url: data.url, publicId: data.publicId });
      else setImage({ url: data.url, publicId: data.publicId });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        content,
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
      const newPost = await API_CALL("/api/social/posts", "POST", payload);

      // שמירה אופטימית: מוסיף את המשחק המתויג למקרה שהשרת עדיין לא תומך בהחזרתו
      if (payload.taggedGame && !newPost.taggedGame) {
        newPost.taggedGame = payload.taggedGame;
      }

      setPosts([newPost, ...posts]);
      setContent("");
      setImage({ url: "", publicId: "" });
      setTaggedGame(null);
      setShowGameSearch(false);
    } catch (error) {
      toast.error("Post failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPostSubmit = async (postId) => {
    if (!editPostContent.trim()) return;
    try {
      const payload = {
        content: editPostContent,
        image: editPostImage,
        taggedGame: editPostTaggedGame
          ? {
              _id: editPostTaggedGame.gameId || editPostTaggedGame._id,
              gameId: editPostTaggedGame.gameId || editPostTaggedGame._id,
              title: editPostTaggedGame.title,
              image: editPostTaggedGame.image,
            }
          : null,
      };

      await API_CALL(`/api/social/posts/${postId}`, "PUT", payload);
      setPosts(
        posts.map((p) =>
          p._id === postId
            ? {
                ...p,
                content: editPostContent,
                image: editPostImage,
                taggedGame: editPostTaggedGame,
                isEdited: true,
              }
            : p,
        ),
      );
      setEditingPost(null);
      toast.success("Updated");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleDeletePost = (postId) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-medium text-[#e8eaed]">
            Are you sure you want to delete this post?
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
                  await API_CALL(`/api/social/posts/${postId}`, "DELETE");
                  setPosts((prev) => prev.filter((p) => p._id !== postId));
                  toast.success("Post deleted successfully");
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

  const handleLike = async (postId) => {
    if (!user) return toast.error("Please login");
    try {
      const data = await API_CALL(`/api/social/posts/${postId}/like`, "POST");
      setPosts(
        posts.map((p) => (p._id === postId ? { ...p, likes: data.likes } : p)),
      );
    } catch (err) {}
  };

  const toggleComments = (postId) =>
    setActiveComments((prev) => ({ ...prev, [postId]: !prev[postId] }));

  const handleShare = (postId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const url = `${window.location.origin}/social?postId=${postId}`;
    navigator.clipboard.writeText(url);
    toast.success("Post link copied to clipboard!");
  };

  const handleAddComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text?.trim()) return;
    try {
      const updatedPost = await API_CALL(
        `/api/social/posts/${postId}/comments`,
        "POST",
        { text },
      );
      setPosts(posts.map((p) => (p._id === postId ? updatedPost : p)));
      setCommentInputs({ ...commentInputs, [postId]: "" });
    } catch (err) {}
  };

  const handleEditCommentSubmit = async (postId, commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const updatedComments = await API_CALL(
        `/api/social/posts/${postId}/comments/${commentId}`,
        "PUT",
        { text: editCommentText },
      );
      setPosts(
        posts.map((p) =>
          p._id === postId ? { ...p, comments: updatedComments } : p,
        ),
      );
      setEditingComment(null);
    } catch (err) {}
  };

  const handleDeleteComment = (postId, commentId) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-medium text-[#e8eaed]">
            Are you sure you want to delete this comment?
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
                    `/api/social/admin/posts/${postId}/comments/${commentId}`,
                    "DELETE",
                  );
                  setPosts((prev) =>
                    prev.map((p) =>
                      p._id === postId
                        ? {
                            ...p,
                            comments: p.comments.filter(
                              (c) => c._id !== commentId,
                            ),
                          }
                        : p,
                    ),
                  );
                  toast.success("Comment deleted successfully");
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

  return (
    <div className="space-y-6">
      {user && (
        <div className="bg-[#303134] rounded-xl p-4 border border-[#5f6368] shadow-md">
          <div className="flex gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#8ab4f8] text-[#202124] font-bold flex items-center justify-center shrink-0">
              {user.userName?.charAt(0).toUpperCase()}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind, ${user.userName}?`}
              className="w-full bg-[#202124] text-[#e8eaed] rounded-xl p-3 border border-[#5f6368] focus:outline-none focus:border-[#8ab4f8] resize-none h-20 text-sm"
            />
          </div>
          {image.url && (
            <div className="relative mb-3 rounded-lg overflow-hidden border border-[#5f6368]">
              <img
                src={image.url}
                alt="Preview"
                className="w-full max-h-60 object-cover"
              />
              <button
                onClick={() => setImage({ url: "", publicId: "" })}
                className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {showGameSearch && (
            <div className="mt-2 mb-3 relative animate-fade-in">
              <input
                type="text"
                placeholder="Search a game to tag..."
                value={gameQuery}
                onChange={(e) => setGameQuery(e.target.value)}
                className="w-full bg-[#202124] text-[#e8eaed] rounded-lg p-2 border border-[#5f6368] focus:border-[#8ab4f8] text-sm outline-none"
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
            <div className="mt-2 mb-3 flex items-center justify-between bg-[#202124] p-2 rounded-lg border border-[#8ab4f8]/50 animate-fade-in">
              <div className="flex items-center gap-3">
                {taggedGame.image && (
                  <img
                    src={taggedGame.image}
                    alt="preview"
                    className="w-8 h-8 rounded object-cover shadow-sm"
                  />
                )}
                <span className="text-sm font-bold text-[#8ab4f8]">
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

          <div className="flex justify-between items-center pt-2 border-t border-[#5f6368]/30">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowGameSearch(!showGameSearch)}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#8ab4f8] transition-colors"
              >
                🎮 Tag Game
              </button>
              <label className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#8ab4f8] cursor-pointer">
                <span>{isUploading ? "Uploading..." : "📷 Photo"}</span>
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
              onClick={handleCreatePost}
              disabled={isSubmitting || isUploading}
              className="bg-[#8ab4f8] text-[#202124] px-5 py-1.5 rounded-full font-bold text-sm hover:bg-[#aecbfa]"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400">Loading feed...</div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => {
            const isAdmin =
              user && (user.role === "admin" || user.role === "owner");
            const isAuthor = user && user._id === post.user?._id;
            const canEdit = isAuthor || isAdmin; // ✨ הוספת הרשאת עריכה למנהל ✨
            const hasLiked = user && post.likes?.includes(user._id);
            const isEditingThisPost = editingPost === post._id;

            return (
              <div
                key={post._id}
                id={`post-${post._id}`}
                className="bg-[#303134] rounded-xl border border-[#5f6368] shadow-md overflow-hidden"
              >
                <div className="p-4 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#3f4042] text-[#8ab4f8] font-bold flex items-center justify-center border border-[#5f6368]">
                      {post.user?.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-[#e8eaed]">
                        {post.user?.userName}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        {timeAgo(post.createdAt)}
                        {post.isEdited && (
                          <span className="italic ml-1.5">(edited)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {canEdit && !isEditingThisPost && (
                      <button
                        onClick={() => {
                          setEditingPost(post._id);
                          setEditPostContent(post.content);
                          setEditPostImage(
                            post.image || { url: "", publicId: "" },
                          );
                          setEditPostTaggedGame(post.taggedGame || null);
                          setEditShowGameSearch(false);
                        }}
                        className="flex items-center gap-1 text-gray-400 hover:text-white bg-[#202124] px-2 py-1 rounded text-xs transition-colors"
                      >
                        <EditIcon /> Edit
                      </button>
                    )}
                    {(isAuthor || isAdmin) && !isEditingThisPost && (
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="flex items-center gap-1 text-gray-400 hover:text-red-400 bg-[#202124] px-2 py-1 rounded text-xs transition-colors"
                      >
                        <DeleteIcon /> Delete
                      </button>
                    )}
                    {user && !isAuthor && !isAdmin && !isEditingThisPost && (
                      <div className="flex items-center gap-1 text-gray-400 bg-[#202124] px-1.5 py-1 rounded text-xs">
                        <ReportButton entityId={post._id} entityType="post" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-3">
                  {isEditingThisPost ? (
                    <div className="mt-2 bg-[#202124] p-3 rounded-lg border border-[#5f6368]">
                      <textarea
                        value={editPostContent}
                        onChange={(e) => setEditPostContent(e.target.value)}
                        className="w-full bg-transparent text-white focus:outline-none mb-3 min-h-[80px]"
                        placeholder="Edit your post..."
                      />
                      {editPostImage.url && (
                        <div className="relative mb-3 rounded border border-[#5f6368]">
                          <img
                            src={editPostImage.url}
                            alt="Preview"
                            className="w-full max-h-40 object-cover rounded"
                          />
                          <button
                            onClick={() =>
                              setEditPostImage({ url: "", publicId: "" })
                            }
                            className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {editPostTaggedGame && (
                        <div className="mt-2 mb-3 flex items-center justify-between bg-black/40 p-2 rounded-lg border border-[#8ab4f8]/50 animate-fade-in">
                          <div className="flex items-center gap-3">
                            {editPostTaggedGame.image && (
                              <img
                                src={editPostTaggedGame.image}
                                alt="preview"
                                className="w-8 h-8 rounded object-cover shadow-sm"
                              />
                            )}
                            <span className="text-sm font-bold text-[#8ab4f8]">
                              {editPostTaggedGame.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditPostTaggedGame(null)}
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
                            className="w-full bg-[#1e1e20] text-[#e8eaed] rounded-lg p-2 border border-[#5f6368] focus:border-[#8ab4f8] text-sm outline-none"
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
                                    setEditPostTaggedGame({
                                      _id: game._id || game.rawgId,
                                      gameId: game._id || game.rawgId,
                                      title: game.title || game.name,
                                      image:
                                        game.image || game.background_image,
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

                      <div className="flex justify-between items-center border-t border-[#5f6368]/50 pt-2">
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() =>
                              setEditShowGameSearch(!editShowGameSearch)
                            }
                            className="text-xs text-gray-400 hover:text-[#8ab4f8] flex items-center gap-1 transition-colors"
                          >
                            🎮 Tag Game
                          </button>
                          <label className="text-xs text-[#8ab4f8] cursor-pointer flex items-center gap-1">
                            📷{" "}
                            {isUploading
                              ? "..."
                              : editPostImage.url
                                ? "Change Image"
                                : "Add Image"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, true)}
                              className="hidden"
                              disabled={isUploading}
                            />
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingPost(null)}
                            className="text-gray-400 text-xs hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEditPostSubmit(post._id)}
                            disabled={isUploading}
                            className="bg-[#8ab4f8] text-[#202124] px-4 py-1 rounded font-bold text-xs"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-[#e8eaed] text-sm whitespace-pre-wrap leading-relaxed">
                        {renderContentWithLinks(post.content)}
                      </p>
                      {post.image?.url && (
                        <div className="mt-3 bg-black flex justify-center border border-[#5f6368] rounded-lg overflow-hidden">
                          <img
                            src={post.image.url}
                            alt="Post asset"
                            className="max-h-[500px] w-full object-contain"
                          />
                        </div>
                      )}
                      {post.taggedGame && (
                        <Link
                          to={`/details/${post.taggedGame.gameId || post.taggedGame._id}`}
                          className="mt-3 flex flex-col bg-[#202124] rounded-lg overflow-hidden border border-[#5f6368] hover:border-[#8ab4f8] transition-all max-w-sm cursor-pointer block"
                        >
                          {post.taggedGame.image ? (
                            <div className="w-full h-40 bg-black overflow-hidden">
                              <img
                                src={post.taggedGame.image}
                                alt="Game Preview"
                                className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-40 bg-[#303134] flex items-center justify-center text-[#5f6368]">
                              No Image
                            </div>
                          )}
                          <div className="p-3 bg-[#303134]">
                            <h4 className="font-bold text-[#e8eaed] text-[15px] mb-1">
                              {post.taggedGame.title}
                            </h4>
                            <div className="text-xs text-[#9aa0a6] mb-2">
                              PlayCheck Game Database
                            </div>
                            <div className="text-[11px] text-[#8ab4f8] font-bold uppercase tracking-wide">
                              View Details →
                            </div>
                          </div>
                        </Link>
                      )}

                      {post.hardwareSnapshot && (
                        <div className="mt-4 flex flex-wrap gap-2 bg-[#202124] p-3 rounded-lg border border-[#5f6368]/50 shadow-inner w-full">
                          <span className="px-2.5 py-1 bg-[#303134] border border-[#5f6368] rounded-md text-xs font-medium text-[#8ab4f8] shadow-sm flex items-center gap-1.5">
                            <span className="text-[14px]">💻</span> CPU:{" "}
                            {cleanHardwareName(post.hardwareSnapshot.cpuName)}
                          </span>
                          <span className="px-2.5 py-1 bg-[#303134] border border-[#5f6368] rounded-md text-xs font-medium text-[#8ab4f8] shadow-sm flex items-center gap-1.5">
                            <span className="text-[14px]">🎮</span> GPU:{" "}
                            {cleanHardwareName(post.hardwareSnapshot.gpuName)}
                          </span>
                          <span className="px-2.5 py-1 bg-[#303134] border border-[#5f6368] rounded-md text-xs font-medium text-[#8ab4f8] shadow-sm flex items-center gap-1.5">
                            <span className="text-[14px]">💾</span> RAM:{" "}
                            {post.hardwareSnapshot.ramGb}GB
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="px-4 py-3 flex flex-wrap gap-6 text-sm text-gray-400 border-t border-[#5f6368]/20 bg-[#202124]/30">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-1.5 font-medium transition-colors ${hasLiked ? "text-[#8ab4f8]" : "hover:text-[#e8eaed]"}`}
                  >
                    👍 {post.likes?.length || 0} Like
                  </button>
                  <button
                    onClick={() => toggleComments(post._id)}
                    className="flex items-center gap-1.5 font-medium hover:text-[#e8eaed] transition-colors"
                  >
                    💬 {post.comments?.length || 0} Comments
                  </button>
                  <button
                    onClick={(e) => handleShare(post._id, e)}
                    className="flex items-center gap-1.5 font-medium hover:text-[#e8eaed] transition-colors ml-auto"
                  >
                    <ShareIcon /> Share
                  </button>
                </div>

                {activeComments[post._id] && (
                  <div className="px-4 py-3 bg-[#202124] border-t border-[#5f6368]/30 space-y-3">
                    {post.comments?.map((comment) => {
                      const isCommentAuthor =
                        user &&
                        (user._id === comment.user?._id ||
                          comment.user === user?._id);
                      const canEditComment = isCommentAuthor || isAdmin; // ✨ הוספת הרשאת עריכה למנהל ✨
                      const isEditing =
                        editingComment?.commentId === comment._id;
                      return (
                        <div
                          key={comment._id}
                          className="flex gap-2 text-sm group"
                        >
                          <div className="w-7 h-7 rounded-full bg-[#3f4042] text-[#8ab4f8] font-bold flex items-center justify-center text-xs shrink-0 mt-1">
                            {comment.user?.userName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="bg-[#303134] p-2.5 rounded-2xl rounded-tl-none inline-block max-w-full relative">
                              <span className="font-bold text-[#e8eaed] flex items-center text-xs mb-0.5">
                                {comment.user?.userName}
                                {isEdited(
                                  comment.createdAt,
                                  comment.updatedAt,
                                ) && (
                                  <span className="font-normal text-[10px] text-gray-500 italic ml-1.5">
                                    (edited)
                                  </span>
                                )}
                              </span>
                              {isEditing ? (
                                <div className="mt-1">
                                  <input
                                    type="text"
                                    value={editCommentText}
                                    onChange={(e) =>
                                      setEditCommentText(e.target.value)
                                    }
                                    className="bg-[#202124] text-white p-1.5 rounded border border-[#5f6368] w-full mb-2 text-xs"
                                    autoFocus
                                  />
                                  <div className="flex gap-2 text-xs">
                                    <button
                                      onClick={() =>
                                        handleEditCommentSubmit(
                                          post._id,
                                          comment._id,
                                        )
                                      }
                                      className="text-[#8ab4f8] font-bold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingComment(null)}
                                      className="text-gray-400"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-300">
                                  {renderContentWithLinks(comment.text)}
                                </span>
                              )}
                            </div>

                            {!isEditing && user && (
                              <div className="flex gap-3 text-[11px] text-gray-500 mt-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canEditComment && (
                                  <button
                                    onClick={() => {
                                      setEditingComment({
                                        postId: post._id,
                                        commentId: comment._id,
                                      });
                                      setEditCommentText(comment.text);
                                    }}
                                    className="hover:text-white flex items-center gap-1"
                                  >
                                    <EditIcon /> Edit
                                  </button>
                                )}
                                {isAdmin && (
                                  <button
                                    onClick={() =>
                                      handleDeleteComment(post._id, comment._id)
                                    }
                                    className="hover:text-red-400 flex items-center gap-1"
                                  >
                                    <DeleteIcon /> Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {user && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-[#5f6368]/20">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[post._id] || ""}
                          onChange={(e) =>
                            setCommentInputs({
                              ...commentInputs,
                              [post._id]: e.target.value,
                            })
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddComment(post._id)
                          }
                          className="flex-1 bg-[#303134] text-sm text-[#e8eaed] rounded-full px-4 py-2 border border-[#5f6368] focus:outline-none focus:border-[#8ab4f8]"
                        />
                        <button
                          onClick={() => handleAddComment(post._id)}
                          className="text-[#8ab4f8] font-bold px-2"
                        >
                          Send
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Feed;
