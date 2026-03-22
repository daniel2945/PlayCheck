import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import MyComputer from "./pages/PcSetup";
import GamesCatalog from "./pages/GamesCatalog";
import Result from "./pages/Result";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";
import "./index.css";

function App() {
  const [view, setView] = useState("home");
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  // State successfully initialized for the comparison flow
  const [selectedGameId, setSelectedGameId] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      setToken(storedToken);
      // Safely switch away from home/login on refresh if the user is authenticated
      setView((prevView) =>
        prevView === "home" || prevView === "login" ? "profile" : prevView,
      );
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user data from localStorage:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetch("http://localhost:3000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          // Only log the user out if the server explicitly rejects the token
          if (res.status === 401 || res.status === 403) {
            setToken(null);
            setUser(null);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("guestSpecs");
            throw new Error("Unauthorized or Token Expired");
          }
          const contentType = res.headers.get("content-type");
          if (
            !res.ok &&
            (!contentType || !contentType.includes("application/json"))
          ) {
            throw new Error("API route not found");
          }
          return res.json();
        })
        .then((data) => {
          if (data && data.success) {
            setUser((prev) => {
              const updatedUser = { ...prev, ...data.data };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              return updatedUser;
            });
          } else if (data && !data.success) {
            console.error(
              "Backend returned error during token validation (Token NOT deleted):",
              data,
            );
          }
        })
        .catch((err) => {
          console.error("Network/API error during token validation:", err);
        });
    } else {
      setUser(null);
    }
  }, [token]);

  const renderView = () => {
    switch (view) {
      case "home":
        return <Home setView={setView} />;
      case "login":
      case "register":
        return (
          <Auth
            view={view}
            setView={setView}
            setToken={setToken}
            setUser={setUser}
          />
        );
      case "pc-setup":
        return <MyComputer setView={setView} token={token} setUser={setUser} />;
      case "games":
        return (
          <GamesCatalog
            setView={setView}
            setSelectedGameId={setSelectedGameId}
          />
        );
      case "result":
        return (
          <Result
            setView={setView}
            selectedGameId={selectedGameId}
            token={token}
          />
        );
      case "profile":
        return <Profile setView={setView} token={token} user={user} />;
      default:
        return <Home setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#202124] text-white font-sans">
      <Navbar
        setView={setView}
        token={token}
        setToken={setToken}
        setUser={setUser}
      />
      {renderView()}
    </div>
  );
}

export default App;
