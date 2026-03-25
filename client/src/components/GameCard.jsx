export default function GameCard({ title, imageUrl, year }) {
  // כתובת תמונה חלופית במקרה שאין תמונה
  const fallbackImage =
    "https://placehold.co/600x400/1a1a1a/ffffff?text=No+Image";

  return (
    <div className="bg-[#303134] rounded-xl overflow-hidden border border-[#5f6368] hover:border-[#8ab4f8] transition-colors h-full flex flex-col shadow-lg">
      {/* אזור התמונה */}
      <div className="relative h-48 w-full">
        <img
          src={imageUrl || fallbackImage}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = fallbackImage;
          }} // הגנה מפני לינקים שבורים
        />
      </div>

      {/* אזור הטקסט */}
      <div className="p-4 flex flex-col flex-grow justify-between gap-3">
        <h3 className="text-[#e8eaed] font-bold text-lg leading-tight line-clamp-2">
          {title}
        </h3>

        {/* תצוגת שנת היציאה (מופיע רק אם יש שנה והיא לא TBA) */}
        {year && year !== "TBA" && (
          <div className="flex items-center gap-2 text-[#9aa0a6] text-sm mt-auto font-medium">
            {/* אייקון של לוח שנה */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{year}</span>
          </div>
        )}
      </div>
    </div>
  );
}
