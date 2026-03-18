import { useState } from "react";

export default function Auth({ view, setView, setToken }) {
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    try {
      const endpoint =
        view === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        view === "login"
          ? { email, password }
          : {
              email,
              password,
              userName,
              // Passing fallback 24-char ObjectIds if guest specs don't exist to prevent 400 error
              cpuId:
                JSON.parse(localStorage.getItem("guestSpecs"))?.cpu?._id ||
                "000000000000000000000000",
              gpuId:
                JSON.parse(localStorage.getItem("guestSpecs"))?.gpu?._id ||
                "000000000000000000000000",
              ram_gb: JSON.parse(localStorage.getItem("guestSpecs"))?.ram || 16,
            };

      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      if (
        !res.ok &&
        (!contentType || !contentType.includes("application/json"))
      ) {
        throw new Error(`API route not found or server error (${res.status})`);
      }

      const data = await res.json();

      if (data.success) {
        if (view === "register") {
          setMessage({
            text: "Registration successful! Please login.",
            type: "success",
          });
          setTimeout(() => setView("login"), 2000);
        } else {
          setToken(data.token);
          localStorage.setItem("token", data.token);
          setView("profile");
        }
      } else {
        setMessage({
          text: data.data || data.message || "Authentication failed",
          type: "error",
        });
      }
    } catch (err) {
      setMessage({ text: "Network Error", type: "error" });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center pt-24">
      <div className="bg-[#303134] p-8 rounded-xl shadow-xl border border-[#5f6368] w-full max-w-sm">
        <h2 className="text-2xl font-medium mb-6 text-[#e8eaed]">
          {view === "login"
            ? isAdminLogin
              ? "Admin Login"
              : "Login"
            : "Register"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {message.text && (
            <div
              className={`p-3 rounded-lg text-sm font-medium border ${message.type === "error" ? "bg-[#303134] text-[#EA4335] border-[#EA4335]" : "bg-[#303134] text-[#34A853] border-[#34A853]"}`}
            >
              {message.text}
            </div>
          )}
          {view === "register" && (
            <input
              type="text"
              placeholder="Username"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="p-3 rounded-lg bg-[#202124] text-[#e8eaed] border border-[#5f6368] focus:outline-none focus:border-[#8ab4f8]"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-lg bg-[#202124] text-[#e8eaed] border border-[#5f6368] focus:outline-none focus:border-[#8ab4f8]"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-lg bg-[#202124] text-[#e8eaed] border border-[#5f6368] focus:outline-none focus:border-[#8ab4f8]"
          />
          <button
            type="submit"
            className="mt-2 p-3 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] rounded-lg font-bold text-lg transition-colors"
          >
            {view === "login" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 text-sm">
          <p
            className="cursor-pointer text-[#9aa0a6] hover:text-[#e8eaed] transition-colors"
            onClick={() => setView(view === "login" ? "register" : "login")}
          >
            {view === "login"
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </p>

          {view === "login" && (
            <p
              className="cursor-pointer text-[#8ab4f8] hover:text-[#aecbfa] transition-colors"
              onClick={() => setIsAdminLogin(!isAdminLogin)}
            >
              {isAdminLogin ? "User Login" : "Admin Login"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
