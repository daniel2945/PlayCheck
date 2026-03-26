import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";

// ייבוא ה-Store של Zustand
import useAuthStore from "./store/useAuthStore";

// ייבוא הקומפוננטות
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import PcSetup from "./pages/PcSetup";
import GamesCatalog from "./pages/GamesCatalog";
import Result from "./pages/Result";
import Profile from "./pages/Profile";
import GameDetails from "./pages/GameDetails";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy"; // למעלה בייבואים
import Settings from "./pages/Settings";
import "./index.css";
import { Toaster } from "react-hot-toast";

// שומר הראש של עמוד המנהל
const AdminRoute = ({ children }) => {
  const { user, token } = useAuthStore();

  // אם אין טוקן או שהמשתמש אינו מנהל/בעלים, זרוק אותו לדף הבית
  if (!token || !user || (user.role !== "admin" && user.role !== "owner")) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  // שליפת הנתונים והפונקציות מה-Store
  const { token, checkAuth } = useAuthStore();

  // בדיקת אימות אחת בלבד כשהאפליקציה עולה
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#303134",
            color: "#e8eaed",
            border: "1px solid #5f6368",
          },
        }}
      />
      <div className="min-h-screen bg-[#202124] text-white font-sans">
        <Routes>
          {/* ה-Layout עוטף את כל הדפים ומכיל את ה-Navbar */}
          <Route path="/" element={<Layout />}>
            {/* דף הבית */}
            <Route index element={<Home />} />

            {/* דף התחברות - אם יש טוקן, הוא "מחליף" (replace) את הדף לפרופיל */}
            <Route
              path="login"
              element={!token ? <Auth /> : <Navigate to="/profile" replace />}
            />

            {/* הגדרת מפרט מחשב */}
            <Route path="setup" element={<PcSetup />} />

            {/* קטלוג משחקים - עכשיו עובד עם Pagination */}
            <Route path="catalog" element={<GamesCatalog />} />

            {/* תוצאות בדיקת תאימות */}
            <Route path="game/:gameId" element={<Result />} />

            {/* דף פרופיל אישי - מוגן: אם אין טוקן, נשלח ללוגין */}
            <Route
              path="profile"
              element={token ? <Profile /> : <Navigate to="/login" replace />}
            />
            <Route path="/details/:gameId" element={<GameDetails />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/settings" element={<Settings />} />

            {/* עמוד מנהל - מוגן על ידי AdminRoute */}
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* דף 404 לכל כתובת לא מוכרת */}
            <Route
              path="*"
              element={
                <div className="text-center pt-32 text-2xl text-[#9aa0a6]">
                  404 - Page Not Found
                </div>
              }
            />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
