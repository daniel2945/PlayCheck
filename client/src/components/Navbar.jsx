export default function Navbar({ setView, token, setToken }) {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-[#202124] border-b border-[#303134]">
      <div
        className="text-2xl font-bold cursor-pointer flex items-center gap-1"
        onClick={() => setView("home")}
      >
        <span className="text-[#4285F4]">P</span>
        <span className="text-[#EA4335]">l</span>
        <span className="text-[#FBBC05]">a</span>
        <span className="text-[#4285F4]">y</span>
        <span className="text-[#34A853]">C</span>
        <span className="text-[#EA4335]">h</span>
        <span className="text-white">eck</span>
      </div>
      <div className="flex gap-4 text-[#e8eaed]">
        <button
          onClick={() => setView("home")}
          className="hover:text-[#8ab4f8] transition-colors"
        >
          Home
        </button>
        {token && (
          <button
            onClick={() => setView("profile")}
            className="hover:text-[#8ab4f8] transition-colors"
          >
            Profile
          </button>
        )}
        <button
          onClick={() => setView("pc-setup")}
          className="hover:text-[#8ab4f8] transition-colors"
        >
          Setup PC
        </button>
        {!token ? (
          <button
            onClick={() => setView("login")}
            className="hover:text-[#8ab4f8] transition-colors"
          >
            Login
          </button>
        ) : (
          <button
            onClick={() => {
              localStorage.removeItem("token");
              setToken(null);
              setView("home");
            }}
            className="hover:text-[#f28b82] transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
