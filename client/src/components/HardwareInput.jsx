import { useState, useEffect } from "react";
<<<<<<< HEAD
import API_CALL from "../api/API_CALL"; // הפונקציה המרכזית שלך
=======
import API_CALL from "../api/API_CALL";
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542

export default function HardwareInput({ type, placeholder, onSelect }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

<<<<<<< HEAD
  // === מנגנון ה-Debounce והקריאה לשרת ===
  useEffect(() => {
    if (query.length < 2) {
      return;
    }

    // מגדירים טיימר. הבקשה תישלח רק אם עברו 300 אלפיות שנייה בלי הקלדה
=======
  // ✨ פונקציית עזר חכמה שמונעת כפילות כמו "Intel Intel Core..." ✨
  const formatHardwareName = (brand, model) => {
    if (!brand) return model;
    if (!model) return brand;
    return model.toLowerCase().startsWith(brand.toLowerCase()) 
      ? model 
      : `${brand} ${model}`;
  };

  useEffect(() => {
    if (query.length < 2) return;

>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await API_CALL(
          `/api/hardware/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}&limit=10`
        );
<<<<<<< HEAD

=======
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
        if (data.success) {
          setResults(data.data);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Failed to fetch hardware:", err);
        setResults([]);
      }
    }, 300);

<<<<<<< HEAD
    // פונקציית ניקוי: אם המשתמש הקליד עוד אות לפני שעברו ה-300ms, הטיימר הקודם מבוטל
    return () => clearTimeout(delayDebounceFn);
  }, [query, type]); // הפונקציה תרוץ מחדש בכל פעם שהטקסט בחיפוש משתנה

  // הפונקציה הזו עכשיו רק מעדכנת את הטקסט, היא לא פונה לשרת!
  const handleChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (newQuery.length < 2) {
      setResults([]);
    }
=======
    return () => clearTimeout(delayDebounceFn);
  }, [query, type]);

  const handleChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (newQuery.length < 2) setResults([]);
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
    setIsOpen(true);
  };

  // === ה-UI נשאר כמעט ללא שינוי, הוא כתוב מצוין ===
  if (selectedItem) {
    return (
      <div className="relative w-full">
        <div className="flex items-center justify-between bg-[#303134] border border-[#5f6368] rounded-full px-6 py-3.5 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-[#9aa0a6] text-sm font-medium">{type}:</span>
            <span className="text-[#e8eaed] text-lg">
              {/* ✨ שימוש בפונקציה החכמה ✨ */}
              {formatHardwareName(selectedItem.brand, selectedItem.model)}
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedItem(null);
              setQuery("");
              if (onSelect) onSelect(null);
            }}
            className="text-[#9aa0a6] hover:text-[#e8eaed] transition-colors p-1"
            title="Clear selection"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="flex items-center bg-[#303134] border border-[#5f6368] rounded-full px-5 py-3.5 focus-within:shadow-lg focus-within:border-[#8ab4f8] transition-all">
        <span className="text-[#9aa0a6] mr-3 font-medium">{type}:</span>
        <input
          type="text"
          className="bg-transparent flex-1 outline-none text-lg text-[#e8eaed] placeholder-[#9aa0a6]"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute w-full bg-[#303134] mt-2 rounded-2xl shadow-2xl z-50 border border-[#5f6368] overflow-hidden max-h-60 overflow-y-auto">
          <div className="py-2">
            {results.map((item) => (
              <div
                key={item._id}
                onClick={() => {
                  setSelectedItem(item);
                  setIsOpen(false);
                  if (onSelect) onSelect(item);
                }}
                className="px-6 py-2.5 hover:bg-[#3c4043] cursor-pointer text-[#e8eaed] transition-colors"
              >
                {/* ✨ שימוש בפונקציה החכמה ✨ */}
                {formatHardwareName(item.brand, item.model)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}