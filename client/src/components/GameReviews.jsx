import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_CALL from "../api/API_CALL";
// 1. ייבוא של Zustand - שנה את הנתיב לפי איך שקראת לקובץ שלך!
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";

export default function GameReviews({ gameId }) {
  const navigate = useNavigate();

  // 2. משיכת המשתמש מזוסטנד (פותר את באג ה"לא מחובר")
  const { user } = useAuthStore();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false); // מתחיל מ-false כדי לא להראות טעינה לאורחים
  const [error, setError] = useState("");

  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" });

  // State לעריכת ביקורות
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editReviewText, setEditReviewText] = useState("");
  const [editReviewRating, setEditReviewRating] = useState(5);

  // 3. בדיקה חכמה: האם יש למשתמש חומרה מוגדרת?
  const hasHardware = user && user.myPc && user.myPc.cpuId && user.myPc.gpuId;

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await API_CALL(`/api/review/${gameId}`, "GET");
      if (res.success) {
        setReviews(res.data);
      } else {
        setError("Failed to load reviews.");
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Network error while loading reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // מביאים ביקורות רק אם המשתמש מחובר ויש לו חומרה (מונע קריאות סתם לשרת)
    if (gameId && hasHardware) {
      fetchReviews();
    }
  }, [gameId, hasHardware]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (newReviewText.trim().length < 10) {
      setSubmitMessage({
        type: "error",
        text: "Review must be at least 10 characters long.",
      });
      return;
    }

    try {
      setSubmitLoading(true);
      setSubmitMessage({ type: "", text: "" });

      const res = await API_CALL("/api/review", "POST", {
        gameId: Number(gameId),
        rating: newReviewRating,
        text: newReviewText,
      });

      if (res.success) {
        setSubmitMessage({
          type: "success",
          text: "Review posted successfully!",
        });
        setNewReviewText("");
        setNewReviewRating(5);
        fetchReviews();
      } else {
        setSubmitMessage({
          type: "error",
          text: res.message || "Failed to post review.",
        });
      }
    } catch (err) {
      setSubmitMessage({
        type: "error",
        text: "An error occurred. Make sure you are logged in.",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateReview = async (e, reviewId) => {
    e.preventDefault();
    if (editReviewText.trim().length < 10) {
      toast.error("Review must be at least 10 characters long.");
      return;
    }
    try {
      const res = await API_CALL(`/api/review/${reviewId}`, "PUT", {
        text: editReviewText,
        rating: editReviewRating,
      });
      if (res.success) {
        toast.success("Review updated successfully!");
        setEditingReviewId(null);
        fetchReviews();
      } else {
        toast.error(res.message || "Failed to update review.");
      }
    } catch (err) {
      toast.error("Error updating review.");
    }
  };

  const handleDeleteReview = (reviewId) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-medium text-[#e8eaed]">
            Are you sure you want to delete this review?
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
                  const res = await API_CALL(
                    `/api/review/${reviewId}`,
                    "DELETE",
                  );
                  if (res.success) {
                    fetchReviews();
                    toast.success("Review deleted successfully");
                  } else {
                    toast.error(res.message || "Failed to delete review");
                  }
                } catch (err) {
                  console.error("Delete review error:", err);
                  toast.error("Error deleting review.");
                }
              }}
              className="px-3 py-1.5 text-sm bg-[#EA4335] text-white rounded hover:bg-[#c5221f] transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }, // משאיר את הטוסט פתוח עד שהמשתמש לוחץ על משהו
    );
  };

  const getBadgeStyle = (matchLevel) => {
    switch (matchLevel) {
      case "Exact Match":
        return "bg-[#34A853]/10 text-[#34A853] border-[#34A853]/30";
      case "Similar Setup":
        return "bg-[#FBBC05]/10 text-[#FBBC05] border-[#FBBC05]/30";
      default:
        return "bg-white/5 text-[#9aa0a6] border-white/10";
    }
  };

  // --- פונקציות העזר החדשות ---

  // מונע כפילויות שם מותג (לדוגמה: מחליף "Intel Intel Core i5" ב-"Intel Core i5")
  const cleanHardwareName = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    // אם המילה הראשונה זהה למילה השנייה, נזרוק את הראשונה
    if (parts.length > 1 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
      return parts.slice(1).join(" ");
    }
    return name;
  };

  // מפרמט את התאריך - אם זה מהיום יכתוב "Today", אחרת תאריך רגיל
  const formatDate = (dateString) => {
    const reviewDate = new Date(dateString);
    const today = new Date();

    // בודק אם התאריך הוא של היום (אותה שנה, חודש ויום)
    const isToday =
      reviewDate.getDate() === today.getDate() &&
      reviewDate.getMonth() === today.getMonth() &&
      reviewDate.getFullYear() === today.getFullYear();

    if (isToday) {
      return "Today";
    }

    return reviewDate.toLocaleDateString("en-GB");
  };

  return (
    <div className="w-full">
      {/* אזור 1: טופס כתיבה או הודעת חסימה (אם אין חומרה / לא מחובר) */}
      {!user ? (
        <div className="bg-gradient-to-r from-[#28292c] to-[#202124] p-6 rounded-2xl border border-white/5 mb-10 text-center shadow-md">
          <p className="text-[#9aa0a6] text-lg">
            Please{" "}
            <span
              className="text-[#8ab4f8] font-bold cursor-pointer hover:underline"
              onClick={() => navigate("/login")}
            >
              log in
            </span>{" "}
            and set up your PC to view and write reviews.
          </p>
        </div>
      ) : !hasHardware ? (
        <div className="bg-gradient-to-r from-[#28292c] to-[#202124] p-6 rounded-2xl border border-white/5 mb-10 text-center shadow-md">
          <p className="text-[#9aa0a6] text-lg">
            You must{" "}
            <span
              className="text-[#8ab4f8] font-bold cursor-pointer hover:underline"
              onClick={() => navigate("/settings")}
            >
              set up your PC specs
            </span>{" "}
            to see hardware-matched reviews!
          </p>
        </div>
      ) : (
        <div className="bg-[#28292c] p-6 sm:p-8 rounded-2xl border border-white/5 mb-10 shadow-xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[#e8eaed] text-xl font-bold">Write a Review</h3>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setNewReviewRating(star)}
                  className={`text-2xl transition-all hover:scale-110 ${
                    newReviewRating >= star
                      ? "text-[#FBBC05] drop-shadow-[0_0_5px_rgba(251,188,5,0.4)]"
                      : "text-[#5f6368]"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
            <textarea
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              placeholder="How does the game run on your PC? Share your experience..."
              className="w-full bg-[#1a1b1e] text-[#e8eaed] border border-white/10 rounded-xl p-4 focus:outline-none focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#8ab4f8] resize-none h-28 transition-all"
            />

            <div className="flex justify-between items-center mt-2">
              <div className="flex-1">
                {submitMessage.text && (
                  <p
                    className={`text-sm font-medium ${
                      submitMessage.type === "error"
                        ? "text-[#EA4335]"
                        : "text-[#34A853]"
                    }`}
                  >
                    {submitMessage.text}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-8 py-2.5 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] font-bold rounded-xl transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-md"
              >
                {submitLoading ? "Posting..." : "Post Review"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* אזור 2: רשימת הביקורות (תוצג רק אם למשתמש יש חומרה!) */}
      {hasHardware && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#e8eaed] text-xl font-bold">Player Reviews</h3>
          </div>

          {/* מקרא - אינדיקציה ברורה למשתמש לגבי רמות ההתאמה */}
          <div className="bg-[#1a1b1e] border border-white/5 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm text-[#9aa0a6] shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#34A853]"></span>
              <span>
                <b>Exact Match:</b> Within 10% of your PC's performance
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FBBC05]"></span>
              <span>
                <b>Similar Setup:</b> Within 25% of your PC's performance
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border border-[#5f6368]"></span>
              <span>
                <b>Different Setup:</b> Performance varies significantly
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-10 h-10 border-4 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <p className="text-[#EA4335] bg-[#EA4335]/10 p-4 rounded-xl border border-[#EA4335]/30">
              {error}
            </p>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 bg-[#28292c] rounded-2xl border border-white/5 border-dashed">
              <p className="text-[#9aa0a6] italic text-lg">
                No reviews yet. Be the first to share your experience!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-[#28292c] p-6 rounded-2xl border border-white/5 relative shadow-md hover:border-white/10 transition-colors"
                >
                  {/* כפתורי עריכה ומחיקה למנהלים / בעלים או למי שכתב את הביקורת */}
                  {user &&
                    (user.role === "admin" ||
                      user.role === "owner" ||
                      user.id === review.userId._id) && (
                      <div className="absolute top-5 right-5 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingReviewId(review._id);
                            setEditReviewText(review.text);
                            setEditReviewRating(review.rating);
                          }}
                          className="text-[#5f6368] hover:text-[#8ab4f8] transition-colors bg-[#202124] p-2 rounded-full border border-transparent hover:border-[#8ab4f8]/30"
                          title="Edit Review"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="text-[#5f6368] hover:text-[#EA4335] transition-colors bg-[#202124] p-2 rounded-full border border-transparent hover:border-[#EA4335]/30"
                          title="Delete Review"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    )}

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <div className="flex items-center gap-4">
                      <span className="text-[#e8eaed] font-bold text-lg">
                        {review.reviewerName}
                      </span>
                      <span className="text-[#FBBC05] text-lg tracking-widest drop-shadow-sm">
                        {"★".repeat(review.rating)}
                        <span className="text-[#5f6368]">
                          {"★".repeat(5 - review.rating)}
                        </span>
                      </span>
                    </div>
                    {review.matchLevel && (
                      <span
                        className={`px-4 py-1.5 text-xs font-bold rounded-full border ${getBadgeStyle(
                          review.matchLevel,
                        )} sm:mr-8 shadow-sm`}
                      >
                        {review.matchLevel}
                      </span>
                    )}
                  </div>

                  {review.hardwareSnapshot && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {/* שימוש בפונקציית הניקוי לשמות החומרה */}
                      <span className="px-3 py-1 bg-[#1a1b1e] border border-white/5 rounded-lg text-xs font-medium text-[#9aa0a6] shadow-sm">
                        💻 CPU:{" "}
                        {cleanHardwareName(review.hardwareSnapshot.cpuName)}
                      </span>
                      <span className="px-3 py-1 bg-[#1a1b1e] border border-white/5 rounded-lg text-xs font-medium text-[#9aa0a6] shadow-sm">
                        🎮 GPU:{" "}
                        {cleanHardwareName(review.hardwareSnapshot.gpuName)}
                      </span>
                      <span className="px-3 py-1 bg-[#1a1b1e] border border-white/5 rounded-lg text-xs font-medium text-[#9aa0a6] shadow-sm">
                        💾 RAM: {review.hardwareSnapshot.ramGb}GB
                      </span>
                    </div>
                  )}

                  {editingReviewId === review._id ? (
                    <form
                      onSubmit={(e) => handleUpdateReview(e, review._id)}
                      className="flex flex-col gap-4 mt-2"
                    >
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setEditReviewRating(star)}
                            className={`text-2xl transition-all hover:scale-110 ${
                              editReviewRating >= star
                                ? "text-[#FBBC05] drop-shadow-[0_0_5px_rgba(251,188,5,0.4)]"
                                : "text-[#5f6368]"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={editReviewText}
                        onChange={(e) => setEditReviewText(e.target.value)}
                        className="w-full bg-[#1a1b1e] text-[#e8eaed] border border-white/10 rounded-xl p-4 focus:outline-none focus:border-[#8ab4f8] resize-none h-28"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingReviewId(null)}
                          className="px-4 py-2 text-sm text-[#9aa0a6] hover:bg-[#3c4043] rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm bg-[#8ab4f8] text-[#202124] font-bold rounded-lg hover:bg-[#aecbfa] transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-[#e8eaed] leading-relaxed whitespace-pre-line text-md mr-14">
                      {review.text}
                    </p>
                  )}
                  <div className="text-right text-[#5f6368] text-xs font-medium mt-4">
                    {/* שימוש בפונקציית פירמוט התאריך */}
                    {formatDate(review.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
