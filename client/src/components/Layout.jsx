import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import API_CALL from "../api/API_CALL";

const fixHebrewToEnglish = (text) => {
  const heb = "/'קראטוןםפשדגכעיחלךף,זסבהנמצתץ.";
  const eng = "qwertyuiopasdfghjkl;'zxcvbnm,./";
  
  let fixedText = "";
  
  for (let char of text) {
    const index = heb.indexOf(char);
    // אם התו הוא אות בעברית, ניקח את המקביל שלו באנגלית. אם לא (רווח/מספר) נשאיר אותו
    fixedText += index > -1 ? eng[index] : char;
  }
  
  return fixedText;
};

export default function Layout() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // סטייטים לחיפוש
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Refs כדי לזהות לחיצה מחוץ לתיבת החיפוש
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  // מנגנון Debounce: מעדכן את השאילתה לשרת רק חצי שנייה אחרי שהמשתמש הפסיק להקליד
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // שליפת התוצאות מהשרת כשה-Debounce מתעדכן
// שליפת התוצאות מהשרת כשה-Debounce מתעדכן
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      
      setIsSearching(true);
      try {
        // ✨ כאן אנחנו מפעילים את הקסם! ✨
        const fixedQuery = fixHebrewToEnglish(debouncedQuery);

        const data = await API_CALL(
          `/api/game/search?q=${encodeURIComponent(fixedQuery)}` // שולחים את המילה המתוקנת!
        );
        
        if (data.success && data.data) {
          setSearchResults(data.data.slice(0, 5));
          setShowDropdown(true);
        }
      } catch (error) {
        console.error("Search fetch error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // ✨ התיקון לבאג הסגירה של החלונית ✨
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideDesktop =
        !desktopSearchRef.current ||
        !desktopSearchRef.current.contains(event.target);
      const isOutsideMobile =
        !mobileSearchRef.current ||
        !mobileSearchRef.current.contains(event.target);

      if (isOutsideDesktop && isOutsideMobile) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowDropdown(false);
      closeMenu();
    }
  };

  const handleGameClick = (gameId) => {
    navigate(`/details/${gameId}`);
    setSearchQuery("");
    setShowDropdown(false);
    closeMenu();
  };

  // משתנה שמכיל את עיצוב ה-Dropdown כדי לא לשכפל קוד
  const dropdownContent = showDropdown && searchQuery.trim() && (
    <div className="absolute top-full left-0 right-0 mt-2 bg-[#303134] border border-[#5f6368] rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
      {isSearching ? (
        <div className="p-4 text-center text-[#9aa0a6] text-sm flex justify-center items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div>
          Searching...
        </div>
      ) : searchResults.length > 0 ? (
        <div>
          {searchResults.map((game) => (
            <div
              key={`search-${game._id}`}
              onClick={() => handleGameClick(game._id)}
              className="flex items-center gap-3 p-3 hover:bg-[#3c4043] cursor-pointer transition-colors border-b border-[#5f6368]/50 last:border-0"
            >
              {game.image ? (
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-[#202124] rounded flex items-center justify-center text-[#5f6368] text-xs">
                  No img
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-[#e8eaed] font-medium text-sm truncate">
                  {game.title || game.name}
                </p>
                {game.releasedDate && game.releasedDate !== "TBA" && (
                  <p className="text-[#9aa0a6] text-xs">
                    {new Date(game.releasedDate).getFullYear()}
                  </p>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="w-full text-center p-3 text-sm text-[#8ab4f8] hover:bg-[#3c4043] transition-colors font-medium bg-[#202124]/50"
          >
            See all results
          </button>
        </div>
      ) : (
        <div className="p-4 text-center text-[#9aa0a6] text-sm">
          No games found.
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#202124] flex flex-col">
      <nav className="sticky top-0 z-50 bg-[#0f172a] border-b border-[#1e293b] shadow-xl">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <Link
            to="/"
            onClick={closeMenu}
            className="text-2xl font-bold flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            <span className="text-[#4285F4]">P</span>
            <span className="text-[#EA4335]">l</span>
            <span className="text-[#FBBC05]">a</span>
            <span className="text-[#4285F4]">y</span>
            <span className="text-[#34A853]">C</span>
            <span className="text-[#EA4335]">h</span>
            <span className="text-white">eck</span>
          </Link>

          <button
            className="md:hidden text-[#94a3b8] hover:text-[#e8eaed] transition-colors focus:outline-none ml-auto"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              )}
            </svg>
          </button>

          <div className="hidden md:flex gap-6 text-[#e8eaed] items-center font-medium text-base">
            <Link to="/" className="hover:text-[#8ab4f8] transition-colors">
              Home
            </Link>
            <Link
              to="/catalog"
              className="hover:text-[#8ab4f8] transition-colors"
            >
              Games
            </Link>
            <Link
              to="/setup"
              className="hover:text-[#8ab4f8] transition-colors"
            >
              Setup PC
            </Link>

            {(user?.role === "admin" || user?.role === "owner") && (
              <Link
                to="/admin"
                className="text-[#EA4335] hover:text-[#f28b82] transition-colors font-bold px-3 py-1 bg-[#EA4335]/10 rounded-md"
              >
                Admin Panel
              </Link>
            )}

            {/* חיפוש דסקטופ */}
            <form
              ref={desktopSearchRef}
              onSubmit={handleSearchSubmit}
              className="relative flex items-center ml-2"
            >
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setShowDropdown(true);
                }}
                className="bg-[#1e293b] text-[#e8eaed] text-sm rounded-full pl-4 pr-10 py-1.5 border border-[#334155] focus:outline-none focus:border-[#8ab4f8] transition-colors w-48 focus:w-64 duration-300"
              />
              <button
                type="submit"
                className="absolute right-3 text-[#94a3b8] hover:text-[#8ab4f8] transition-colors"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </button>
              {dropdownContent}
            </form>

            {!token ? (
              <Link
                to="/login"
                className="hover:text-[#8ab4f8] transition-colors border-l border-[#334155] pl-6 ml-2"
              >
                Login
              </Link>
            ) : (
              <div className="flex items-center gap-4 border-l border-[#334155] pl-6 ml-2">
                <Link
                  to="/profile"
                  title="My Profile"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1e293b] border border-[#334155] hover:border-[#8ab4f8] hover:bg-[#334155] transition-all group"
                >
                  <svg
                    className="w-5 h-5 text-[#94a3b8] group-hover:text-[#8ab4f8] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                </Link>
                <Link
                  to="/settings"
                  className="hover:text-[#8ab4f8] transition-colors font-medium text-[#94a3b8]"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="hover:text-[#f28b82] transition-colors font-medium text-[#94a3b8]"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden flex flex-col px-6 pt-4 pb-6 gap-5 bg-[#0f172a] border-t border-[#1e293b] shadow-inner text-lg">
            {/* חיפוש מובייל */}
            <form
              ref={mobileSearchRef}
              onSubmit={handleSearchSubmit}
              className="relative flex items-center mb-2"
            >
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setShowDropdown(true);
                }}
                className="bg-[#1e293b] text-[#e8eaed] w-full rounded-lg pl-4 pr-10 py-2 border border-[#334155] focus:outline-none focus:border-[#8ab4f8] transition-colors"
              />
              <button
                type="submit"
                className="absolute right-3 text-[#94a3b8] hover:text-[#8ab4f8]"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </button>
              {dropdownContent}
            </form>

            <Link
              to="/"
              onClick={closeMenu}
              className="text-[#94a3b8] hover:text-[#8ab4f8] transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              to="/catalog"
              onClick={closeMenu}
              className="text-[#94a3b8] hover:text-[#8ab4f8] transition-colors font-medium"
            >
              Games
            </Link>
            <Link
              to="/setup"
              onClick={closeMenu}
              className="text-[#94a3b8] hover:text-[#8ab4f8] transition-colors font-medium"
            >
              Setup PC
            </Link>

            {(user?.role === "admin" || user?.role === "owner") && (
              <Link
                to="/admin"
                onClick={closeMenu}
                className="text-[#EA4335] hover:text-[#f28b82] transition-colors font-bold block w-fit px-4 py-1.5 bg-[#EA4335]/10 rounded-lg"
              >
                Admin Panel
              </Link>
            )}

            <div className="w-full h-px bg-[#1e293b] my-1"></div>

            {!token ? (
              <Link
                to="/login"
                onClick={closeMenu}
                className="text-[#8ab4f8] font-bold"
              >
                Login / Register
              </Link>
            ) : (
              <div className="flex flex-col gap-5">
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="flex items-center gap-2 text-[#e8eaed] hover:text-[#8ab4f8] font-medium transition-colors"
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                  My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={closeMenu}
                  className="text-[#94a3b8] hover:text-[#8ab4f8] transition-colors font-medium"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left text-[#f28b82] font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      <main className="flex-grow flex flex-col relative">
        <Outlet />
      </main>

      <footer className="bg-[#0f172a] border-t border-[#1e293b] py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#94a3b8] text-sm font-medium">
            &copy; 2026{" "}
            <span className="text-[#e8eaed] font-bold tracking-wide">
              PlayCheck
            </span>
            . All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-[#94a3b8]">
            <Link
              to="/terms"
              className="hover:text-[#e8eaed] transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              className="hover:text-[#e8eaed] transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
