import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_CALL from "../api/API_CALL";
import useAuthStore from "../store/useAuthStore";
import { GoogleLogin } from "@react-oauth/google";

export default function Auth() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [isLoginView, setIsLoginView] = useState(true);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!isLoginView && password !== confirmPassword) {
      return setMessage({ text: "Passwords do not match!", type: "error" });
    }

    try {
      const endpoint = isLoginView ? "/api/auth/login" : "/api/auth/register";
      let payload = { email, password };

      if (!isLoginView) {
        const guestSpecs = JSON.parse(localStorage.getItem("guestSpecs")) || {};
        payload = {
          ...payload,
          userName,
          myPc: {
            cpuId: guestSpecs.cpu?._id || "000000000000000000000000",
            gpuId: guestSpecs.gpu?._id || "000000000000000000000000",
            ramGb: guestSpecs.ram || 16,
          },
        };
      }

      const data = await API_CALL(endpoint, "POST", payload);

      if (!isLoginView) {
        setMessage({
          text: "Registration successful! Please login.",
          type: "success",
        });
        setTimeout(() => {
          setIsLoginView(true);
          setConfirmPassword("");
        }, 2000);
      } else {
        if (data.token && data.user) {
          setAuth(data.user, data.token);
          localStorage.removeItem("guestSpecs");
          navigate("/profile");
        }
      }
    } catch (err) {
      setMessage({
        text: err.message || "Authentication failed",
        type: "error",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center pt-16 sm:pt-24">
      <div className="bg-[#303134] p-6 sm:p-8 rounded-xl shadow-xl border border-[#5f6368] w-full max-w-sm">
        <h2 className="text-2xl font-medium mb-6 text-[#e8eaed]">
          {isLoginView ? (isAdminLogin ? "Admin Login" : "Login") : "Register"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {message.text && (
            <div
              className={`p-3 rounded-lg text-sm font-medium border ${
                message.type === "error"
                  ? "text-[#EA4335] border-[#EA4335]"
                  : "text-[#34A853] border-[#34A853]"
              }`}
            >
              {message.text}
            </div>
          )}

          {!isLoginView && (
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

          {!isLoginView && (
            <input
              type="password"
              placeholder="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="p-3 rounded-lg bg-[#202124] text-[#e8eaed] border border-[#5f6368] focus:outline-none focus:border-[#8ab4f8]"
            />
          )}

          <button
            type="submit"
            className="mt-2 p-3 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] rounded-lg font-bold text-lg transition-colors"
          >
            {isLoginView ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 mb-2 flex items-center justify-between">
          <hr className="w-full border-[#5f6368]" />
          <span className="p-2 text-[#9aa0a6] text-xs uppercase">Or</span>
          <hr className="w-full border-[#5f6368]" />
        </div>

        <div className="flex justify-center mb-4">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const data = await API_CALL("/api/auth/google", "POST", {
                  credential: credentialResponse.credential,
                });

                if (data.token && data.user) {
                  setAuth(data.user, data.token);
                  localStorage.removeItem("guestSpecs");
                  navigate("/profile");
                }
              } catch (err) {
                console.error("Google Login Server Error:", err);
                setMessage({
                  text: err.message || "Google Login failed",
                  type: "error",
                });
              }
            }}
            onError={() => {
              console.log("Google Login Failed");
            }}
          />
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <p
            className="cursor-pointer text-[#9aa0a6] hover:text-[#e8eaed] transition-colors"
            onClick={() => {
              setIsLoginView(!isLoginView);
              setMessage({ text: "", type: "" });
            }}
          >
            {isLoginView
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </p>
        </div>
      </div>
    </div>
  );
}
