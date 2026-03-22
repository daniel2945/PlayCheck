export default function GameCard({ title, imageUrl, setView }) {
  return (
    <div
      className="bg-[#303134] border border-[#5f6368] rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-[#8ab4f8] transition-all"
      onClick={() => setView("result")}
    >
      <div className="h-48 bg-[#202124] flex items-center justify-center text-[#9aa0a6] italic">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          "Image Placeholder"
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-[#e8eaed] mb-1">{title}</h3>
        <div className="text-[#fbbc05] text-sm">⭐⭐⭐⭐⭐</div>
      </div>
    </div>
  );
}
