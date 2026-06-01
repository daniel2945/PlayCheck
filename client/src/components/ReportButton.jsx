import toast from "react-hot-toast";
import API_CALL from "../api/API_CALL";

export default function ReportButton({ entityId, entityType, onReported }) {
  const handleReport = () => {
    let reason = "";
    toast(
      (t) => (
        <div className="flex flex-col gap-3 min-w-[250px]">
          <p className="font-medium text-[#e8eaed]">Report this {entityType}</p>
          <textarea
            placeholder="Why are you reporting this?"
            onChange={(e) => (reason = e.target.value)}
            className="w-full p-2 bg-[#202124] text-[#e8eaed] rounded border border-[#5f6368] outline-none"
            rows="3"
          />
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-sm text-[#9aa0a6] hover:bg-[#3c4043] rounded"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!reason.trim()) return toast.error("Reason is required");
                toast.dismiss(t.id);
                try {
                  let endpoint = "";
                  if (entityType === "review")
                    endpoint = `/api/review/${entityId}/report`;
                  else if (entityType === "post")
                    endpoint = `/api/social/posts/${entityId}/report`;
                  else if (entityType === "thread")
                    endpoint = `/api/social/threads/${entityId}/report`;
                  await API_CALL(endpoint, "POST", { reason });
                  toast.success(`${entityType} reported successfully`);
                  if (onReported) onReported();
                } catch (err) {
                  toast.error(err.message || "Failed to report");
                }
              }}
              className="px-3 py-1.5 text-sm bg-[#EA4335] text-white rounded hover:bg-[#c5221f]"
            >
              Report
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  return (
    <button
      onClick={handleReport}
      className="text-[#9aa0a6] hover:text-[#EA4335] text-sm flex items-center gap-1 transition-colors"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
        />
      </svg>
      Report
    </button>
  );
}
