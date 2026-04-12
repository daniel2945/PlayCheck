import { useState, useEffect } from "react";
import API_CALL from "../api/API_CALL";

export default function HardwareInput({ type, placeholder, onSelect, value }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const formatHardwareName = (brand, model) => {
    if (!brand) return model;
    if (!model) return brand;
    return model.toLowerCase().startsWith(brand.toLowerCase())
      ? model
      : `${brand} ${model}`;
  };

  // ✨ NEW: Listen for external value injections (like Deep Scan)
  useEffect(() => {
    if (value && value._id !== selectedItem?._id) {
      setSelectedItem(value);
      setQuery(formatHardwareName(value.brand, value.model));
    } else if (!value) {
      setSelectedItem(null);
      setQuery("");
    }
  }, [value]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await API_CALL(
          `/api/hardware/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}&limit=10`,
        );
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

    return () => clearTimeout(delayDebounceFn);
  }, [query, type]);

  const handleChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
  };

  if (selectedItem) {
    return (
      <div className="relative w-full">
        <div className="flex items-center justify-between bg-[#303134] border border-[#5f6368] rounded-full px-6 py-3.5 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-[#9aa0a6] text-sm font-medium">{type}:</span>
            <span className="text-[#e8eaed] text-lg">
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
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
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

      {isOpen && query.length >= 2 && (
        <div
          className="absolute w-full bg-[#303134] mt-2 rounded-2xl shadow-2xl z-50 border border-[#5f6368] overflow-hidden"
          onMouseDown={(e) => e.preventDefault()} // ✨ התיקון: מונע מהתיבה להיסגר כשנוגעים בה ✨
        >
          {results.length > 0 ? (
            <div className="py-2 max-h-60 overflow-y-auto">
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
                  {formatHardwareName(item.brand, item.model)}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-6 text-center">
              <p className="text-[#9aa0a6] text-sm mb-1">
                Can't find your {type.toLowerCase()}?
              </p>
              <p className="text-[#e8eaed] text-sm leading-relaxed">
                Contact us at: <br />
                <a
                  href="mailto:playcheck769@gmail.com"
                  className="text-[#8ab4f8] font-bold hover:underline"
                >
                  playcheck769@gmail.com
                </a>
                <br />
                <span className="text-[#9aa0a6] text-xs">
                  and we'll add it for you!
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
