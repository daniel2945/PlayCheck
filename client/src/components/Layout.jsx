import { Link, useNavigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

export default function Layout() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/"); 
  };

  return (
    <div className="min-h-screen bg-[#202124] flex flex-col">
      
      {/* סרגל ניווט - צבע כחול-עמוק שנותן קונטרסט ברור */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0f172a] border-b border-[#1e293b] shadow-xl">
        {/* לוגו */}
        <Link to="/" className="text-2xl font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
          <span className="text-[#4285F4]">P</span>
          <span className="text-[#EA4335]">l</span>
          <span className="text-[#FBBC05]">a</span>
          <span className="text-[#4285F4]">y</span>
          <span className="text-[#34A853]">C</span>
          <span className="text-[#EA4335]">h</span>
          <span className="text-white">eck</span>
        </Link>

        {/* קישורים */}
        <div className="flex gap-6 text-[#e8eaed] items-center font-medium">
          <Link to="/" className="hover:text-[#8ab4f8] transition-colors">
            Home
          </Link>
          <Link to="/catalog" className="hover:text-[#8ab4f8] transition-colors">
            Games
          </Link>
          <Link to="/setup" className="hover:text-[#8ab4f8] transition-colors">
            Setup PC
          </Link>

          {token && (
            <Link to="/profile" className="hover:text-[#8ab4f8] transition-colors">
              Profile
            </Link>
          )}

          {user?.isAdmin && (
            <Link to="/admin" className="text-[#EA4335] hover:text-[#f28b82] transition-colors font-bold px-2 py-1 bg-[#EA4335]/10 rounded-md">
              Admin Panel
            </Link>
          )}

          {!token ? (
            <Link to="/login" className="hover:text-[#8ab4f8] transition-colors">
              Login
            </Link>
          ) : (
            <div className="flex items-center gap-4 border-l border-[#334155] pl-4 ml-2">
              <button
                onClick={handleLogout}
                className="hover:text-[#f28b82] transition-colors font-medium text-[#94a3b8]"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* אזור התוכן */}
      <main className="flex-grow flex flex-col relative">
        <Outlet />
      </main>

      {/* פוטר - תואם להדר */}
      <footer className="bg-[#0f172a] border-t border-[#1e293b] py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#94a3b8] text-sm font-medium">
            &copy; 2026 <span className="text-[#e8eaed] font-bold tracking-wide">PlayCheck</span>. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-[#94a3b8]">
            {/* הפכנו אותם לקישורים אמיתיים! */}
            <Link to="/terms" className="hover:text-[#e8eaed] transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-[#e8eaed] transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
      
    </div>
  );
}