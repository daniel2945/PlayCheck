import { useState, useEffect } from "react";
import API_CALL from "../api/API_CALL";
import toast from "react-hot-toast";

export default function ReportedReviewsAdmin() {
  const [reportedReviews, setReportedReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportedReviews = async () => {
    try {
      setLoading(true);
      const res = await API_CALL("/api/review/reported", "GET");
      if (res.success) {
        setReportedReviews(res.data);
      } else {
        toast.error("Failed to fetch reported reviews");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportedReviews();
  }, []);

  const handleDeleteReview = (reviewId) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-medium text-[#e8eaed]">
            Are you sure you want to DELETE this review? This is permanent.
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
                    toast.success("Review deleted successfully");
                    setReportedReviews((prev) =>
                      prev.filter((r) => r._id !== reviewId),
                    );
                  } else {
                    toast.error(res.message || "Failed to delete review");
                  }
                } catch (err) {
                  toast.error(err.message || "Error deleting review");
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

  const handleDismissReports = (reviewId) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-medium text-[#e8eaed]">
            Are you sure you want to dismiss all reports? The review will be
            considered safe.
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
                    `/api/review/${reviewId}/reports`,
                    "DELETE",
                  );
                  if (res.success) {
                    toast.success("Reports cleared. Review is safe.");
                    setReportedReviews((prev) =>
                      prev.filter((r) => r._id !== reviewId),
                    );
                  } else {
                    toast.error(res.message || "Failed to dismiss reports");
                  }
                } catch (err) {
                  toast.error(err.message || "Error dismissing reports");
                }
              }}
              className="px-3 py-1.5 text-sm bg-[#8ab4f8] text-[#202124] font-bold rounded hover:bg-[#aecbfa] transition-colors"
            >
              Dismiss Reports
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-[#8ab4f8]">
        Loading reported reviews...
      </div>
    );
  }

  return (
    <div className="bg-[#202124] p-6 rounded-2xl border border-white/10 shadow-lg">
      <h2 className="text-[#e8eaed] text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="text-[#EA4335]">🚩</span> Reported Reviews
      </h2>

      {reportedReviews.length === 0 ? (
        <div className="bg-[#28292c] p-8 rounded-xl text-center border border-dashed border-white/10">
          <p className="text-[#9aa0a6] text-lg">
            Hooray! No reported reviews pending.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reportedReviews.map((review) => (
            <div
              key={review._id}
              className="bg-[#28292c] p-5 rounded-xl border border-[#EA4335]/30"
            >
              {/* Reviewer Info & Original Text */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#8ab4f8] font-bold">
                    Author: {review.userId?.userName || "Unknown"}
                  </span>
                  <span className="text-[#FBBC05]">
                    Rating: {review.rating} ★
                  </span>
                </div>
                <p className="text-[#e8eaed] bg-[#1a1b1e] p-3 rounded-lg border border-white/5">
                  {review.text}
                </p>
              </div>

              {/* Reports Section */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-[#9aa0a6] uppercase tracking-wider mb-2">
                  Reports ({review.reports.length})
                </h4>
                <div className="space-y-2">
                  {review.reports.map((report, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-start text-sm bg-[#1a1b1e]/50 p-2 rounded"
                    >
                      <span className="text-[#EA4335] mt-0.5">↳</span>
                      <div>
                        <span className="text-[#9aa0a6] font-medium mr-2">
                          [{report.userId?.userName || "Unknown"}]:
                        </span>
                        <span className="text-[#e8eaed]">{report.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleDismissReports(review._id)}
                  className="px-4 py-2 text-sm text-[#9aa0a6] hover:bg-[#3c4043] rounded-lg transition-colors font-medium border border-white/10"
                >
                  Ignore & Clear Reports
                </button>
                <button
                  onClick={() => handleDeleteReview(review._id)}
                  className="px-4 py-2 text-sm bg-[#EA4335] text-white hover:bg-[#c5221f] rounded-lg transition-colors font-bold"
                >
                  Delete Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
