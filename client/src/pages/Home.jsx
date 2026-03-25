import { Link } from "react-router-dom";
import useAuthStore from "../store/useAuthStore"; // ייבוא ה-Store

export default function Home() {
  // שליפת המשתמש מה-Store
  const user = useAuthStore((state) => state.user);

  return (
    /* עטיפה חדשה: מגדירה את האזור כולו כיחסי (relative) כדי שהרקע יישב מאחור */
    <div className="relative w-full min-h-[65vh] flex flex-col items-center justify-center">
      {/* תמונת הרקע ושכבת הטשטוש (Gradient) */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: "url('/games-collage.jpg')" }} // ודא שיש תמונה בשם הזה בתיקיית public
      >
        {/* הדעיכה עצמה: שקוף למעלה, מתעמעם, והופך לצבע הרקע של האתר למטה (#202124) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#202124]/70 to-[#202124]"></div>
      </div>

      {/* התוכן המקורי שלך - עכשיו עם z-10 כדי שיישב מעל הרקע */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center mt-10">
        <h1 className="text-30xl sm:text-6xl text-white mb-6 sm:mb-8 font-bold text-center drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">
          Can You Run It?
        </h1>

        <p className="text-xl text-[#9aa0a6] mb-12 max-w-2xl drop-shadow-md font-medium">
          Check if your PC meets the hardware requirements for the latest and
          greatest games. Browse our catalog, set up your specs, and let our AI
          do the rest.
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
    </div>
  );
}
