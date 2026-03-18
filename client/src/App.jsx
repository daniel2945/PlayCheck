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

  useEffect(() => {
    if (token) {
      fetch("http://localhost:3000/api/auth/getUser", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
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
          if (data.success) {
            setUser(data.data);
          } else {
            setToken(null);
            localStorage.removeItem("token");
          }
        })
        .catch(() => {
          setToken(null);
          localStorage.removeItem("token");
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
        return <Auth view={view} setView={setView} setToken={setToken} />;
      case "pc-setup":
        return <MyComputer setView={setView} token={token} />;
      case "games":
        return <GamesCatalog setView={setView} />;
      case "result":
        return <Result setView={setView} />;
      case "profile":
        return <Profile setView={setView} token={token} />;
      default:
        return <Home setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#202124] text-white font-sans">
      <Navbar setView={setView} token={token} setToken={setToken} />
      {renderView()}
    </div>
  );
}

export default App;
