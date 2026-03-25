import { Link } from "react-router-dom";
import useAuthStore from "../store/useAuthStore"; // ייבוא ה-Store

export default function Home() {
  // שליפת המשתמש מה-Store
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex flex-col items-center justify-center pt-20 sm:pt-32 px-4 text-center">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 text-[#e8eaed] tracking-tight">
        Can You Run It?
      </h1>
      <p className="text-xl text-[#9aa0a6] mb-12 max-w-2xl">
        Check if your PC meets the hardware requirements for the latest and
        greatest games. Browse our catalog, set up your specs, and let our AI do
        the rest.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/catalog"
          className="bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] font-bold px-8 py-3 rounded-full transition-colors shadow-lg"
        >
          Browse Games
        </Link>

        <Link
          to="/setup"
          className="bg-[#303134] hover:bg-[#3c4043] border border-[#5f6368] text-[#e8eaed] font-medium px-8 py-3 rounded-full transition-colors"
        >
          Setup My PC
        </Link>

        {/* ✨ התיקון: הצגה מותנית של כפתור ההתחברות ✨ */}
        {!user ? (
          <Link
            to="/login"
            className="bg-[#303134] hover:bg-[#3c4043] border border-[#5f6368] text-[#e8eaed] font-medium px-8 py-3 rounded-full transition-colors"
          >
            Login / Register
          </Link>
        ) : (
          // אופציונלי: כפתור לפרופיל אם המשתמש כבר מחובר
          <Link
            to="/profile"
            className="bg-[#34A853] hover:bg-[#2d9047] text-[#202124] font-bold px-8 py-3 rounded-full transition-colors shadow-lg"
          >
            My Profile
          </Link>
        )}
      </div>
    </div>
  );
}
