import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import API_CALL from "../api/API_CALL";
import toast from "react-hot-toast";

export default function Settings() {
  const navigate = useNavigate();
  // שולפים את המשתמש והפונקציות מה-Store
  const { user, logout, setAuth, token } = useAuthStore();

  // סטייטים לפרופיל
  const [userName, setUserName] = useState(user?.userName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profilePassword, setProfilePassword] = useState("");

  // סטייטים לסיסמה
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // --- עדכון שם משתמש ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // עדכון שם משתמש רק אם השתנה
      if (userName !== user.userName) {
        await API_CALL("/api/auth/me/name", "PUT", { userName });
      }

      // עדכון מייל רק אם השתנה (דורש סיסמה)
      if (email !== user.email) {
        if (!profilePassword) {
          toast.error("Password is required to change your email.");
          setLoading(false);
          return;
        }
        await API_CALL("/api/auth/me/email", "PUT", {
          email,
          password: profilePassword,
        });
      }

      toast.success("Profile updated successfully!");
      setAuth({ ...user, userName, email }, token);
      setProfilePassword("");
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // --- עדכון סיסמה ---
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await API_CALL("/api/auth/me/password", "PUT", {
        currentPassword,
        password: newPassword,
      });

      if (data.success) {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  // --- מחיקת חשבון ---
  const handleDeleteAccount = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-medium text-[#e8eaed]">
            Are you absolutely sure you want to delete your account? This action
            cannot be undone and your PC specs will be lost.
          </p>
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-sm text-[#9aa0a6] hover:bg-[#3c4043] rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await API_CALL("/api/auth/me", "DELETE");
                  logout();
                  navigate("/");
                } catch (err) {
                  toast.error(err.message || "Failed to delete account.");
                }
              }}
              className="px-3 py-1.5 text-sm bg-[#EA4335] text-white rounded hover:bg-[#c5221f] transition-colors"
            >
              Delete My Account
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };
  return (
    <div className="relative w-full min-h-screen">
      {/* אזור הרקע עם התמונה והטשטוש */}
      <div
        className="absolute top-0 left-0 w-full h-[55vh] bg-cover bg-center bg-no-repeat z-0 pointer-events-none"
        style={{ backgroundImage: "url('/settings-bg.jpg')" }}
      >
        {/* הגרדיאנט מתחיל כהה מראש (60%) כדי להבליט את הכותרת */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#202124]/60 via-[#202124]/90 to-[#202124]"></div>
      </div>

      {/* התוכן המקורי שיושב מעל הרקע */}
      <div className="relative z-10 pt-16 sm:pt-24 px-4 sm:px-6 max-w-4xl mx-auto min-h-screen pb-12 w-full">
        {/* כותרת עם טריק ההצללה שלמדנו */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 border-b border-[#5f6368] pb-4 text-center sm:text-left drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">
          Account Settings
        </h1>

        <div className="space-y-8">
          {/* =========================================
              כרטיסיית פרטי פרופיל
          ========================================= */}
          <section className="bg-[#303134]/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-[#5f6368] shadow-lg">
            <h2 className="text-xl font-semibold text-[#8ab4f8] mb-6">
              Profile Information
            </h2>
            <form
              onSubmit={handleUpdateProfile}
              className="flex flex-col gap-5"
            >
              <div>
                <label className="block text-[#9aa0a6] text-sm mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#202124] text-[#e8eaed] border border-[#5f6368] outline-none focus:border-[#8ab4f8] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#9aa0a6] text-sm mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#202124] text-[#e8eaed] border border-[#5f6368] outline-none focus:border-[#8ab4f8] transition-colors"
                />
              </div>

              {email !== user?.email && (
                <div className="animate-fade-in">
                  <label className="block text-[#9aa0a6] text-sm mb-2">
                    Verify Password <span className="text-[#EA4335]">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder="Enter current password to save email"
                    className="w-full p-3 rounded-lg bg-[#202124] text-[#e8eaed] border border-[#5f6368] outline-none focus:border-[#8ab4f8] transition-colors"
                  />
                  <p className="text-xs text-[#9aa0a6] mt-2">
                    Required to verify your identity when changing email
                    address.
                  </p>
                </div>
              )}

              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#8ab4f8] text-[#202124] font-bold rounded-lg hover:bg-[#aecbfa] transition-colors disabled:opacity-50 shadow-md"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </section>

          {/* =========================================
              כרטיסיית אבטחה (סיסמה)
          ========================================= */}
          <section className="bg-[#303134]/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-[#5f6368] shadow-lg">
            <h2 className="text-xl font-semibold text-[#8ab4f8] mb-6">
              Security
            </h2>
            <form
              onSubmit={handleUpdatePassword}
              className="flex flex-col gap-5"
            >
              <div>
                <label className="block text-[#9aa0a6] text-sm mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#202124] text-[#e8eaed] border border-[#5f6368] outline-none focus:border-[#8ab4f8] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[#9aa0a6] text-sm mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#202124] text-[#e8eaed] border border-[#5f6368] outline-none focus:border-[#8ab4f8] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#9aa0a6] text-sm mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#202124] text-[#e8eaed] border border-[#5f6368] outline-none focus:border-[#8ab4f8] transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#8ab4f8] text-[#202124] font-bold rounded-lg hover:bg-[#aecbfa] transition-colors disabled:opacity-50 shadow-md"
                >
                  Change Password
                </button>
              </div>
            </form>
          </section>

          {/* =========================================
              כרטיסיית סכנה (מחיקה)
          ========================================= */}
          <section className="bg-[#202124]/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-[#EA4335]/30 shadow-lg">
            <h2 className="text-xl font-semibold text-[#EA4335] mb-4">
              Danger Zone
            </h2>
            <p className="text-[#9aa0a6] mb-6">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="px-6 py-2.5 border border-[#EA4335] text-[#EA4335] font-bold rounded-lg hover:bg-[#EA4335] hover:text-white transition-colors shadow-sm"
            >
              Delete Account
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
