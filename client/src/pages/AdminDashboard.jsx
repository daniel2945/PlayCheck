import { useState, useEffect } from "react";
import API_CALL from "../api/API_CALL";
import useAuthStore from "../store/useAuthStore";

export default function AdminDashboard() {
  const currentUser = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState("users");
  
  // נתונים
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [hardwares, setHardwares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // סטייטים למודלים (Modals)
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
<<<<<<< HEAD
=======
  const [isEditingGame, setIsEditingGame] = useState(false);

  // סטייטים לחיפושים
  const [gameSearchQuery, setGameSearchQuery] = useState("");
  const [hardwareSearchQuery, setHardwareSearchQuery] = useState("");
  
  // עימוד חומרה
  const [hardwarePage, setHardwarePage] = useState(1);
  const hardwareItemsPerPage = 10;
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542

  // טופס חומרה
  const [hardwareForm, setHardwareForm] = useState({ type: "CPU", brand: "", model: "", benchmarkScore: 0 });
  
<<<<<<< HEAD
  // טופס משחקים - מותאם ב-100% לסכמה (כולל דרישות מערכת!)
  const [gameForm, setGameForm] = useState({ 
=======
  // טופס משחקים - כולל releasedDate
  const defaultGameForm = { 
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
    _id: "", 
    title: "", 
    description: "", 
    image: "",
<<<<<<< HEAD
=======
    releasedDate: "TBA",
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
    requirements: {
      minimum: { cpuScore: 0, gpuScore: 0, ramGb: 0, cpuText: "", gpuText: "" },
      recommended: { cpuScore: 0, gpuScore: 0, ramGb: 0, cpuText: "", gpuText: "" }
    }
<<<<<<< HEAD
  });
=======
  };
  const [gameForm, setGameForm] = useState(defaultGameForm);
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
  
  // טופס משתמשים (כולל סיסמה)
  const [userForm, setUserForm] = useState({ 
    _id: "", 
    userName: "", 
    email: "", 
    isAdmin: false, 
    newPassword: "" 
  });

  // שליפת נתונים
  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      if (activeTab === "users") {
        const data = await API_CALL("/api/auth");
        if (data.success) setUsers(data.data);
      } else if (activeTab === "games") {
        const data = await API_CALL("/api/game?limit=1000");
        if (data.success) setGames(data.data);
      } else if (activeTab === "hardware") {
        const data = await API_CALL("/api/hardware");
        if (data.success) setHardwares(data.data);
      }
    } catch (err) { setError(err.message || "Failed to fetch data"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  // ==========================================
  // פונקציות ניהול משתמשים
  // ==========================================
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user ${userName}?`)) return;
    try {
      await API_CALL(`/api/auth/${userId}`, "DELETE");
      setUsers(users.filter((u) => u._id !== userId));
    } catch (err) { alert("Error: " + err.message); }
  };

  const openUserModal = (user) => {
    setUserForm({ 
      _id: user._id, 
      userName: user.userName, 
      email: user.email, 
      isAdmin: user.isAdmin, 
      newPassword: "" 
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      await API_CALL(`/api/auth/${userForm._id}/name`, "PUT", { name: userForm.userName, userName: userForm.userName });
      await API_CALL(`/api/auth/${userForm._id}/email`, "PUT", { email: userForm.email });
      await API_CALL(`/api/auth/${userForm._id}/role`, "PUT", { isAdmin: userForm.isAdmin });
      
<<<<<<< HEAD
      // עדכון סיסמה רק אם השדה לא ריק
=======
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
      if (userForm.newPassword && userForm.newPassword.trim() !== "") {
        await API_CALL(`/api/auth/${userForm._id}/password`, "PUT", { password: userForm.newPassword });
      }
      
      setUsers(users.map((u) => (u._id === userForm._id ? { ...u, userName: userForm.userName, email: userForm.email, isAdmin: userForm.isAdmin } : u)));
      setIsUserModalOpen(false);
    } catch (err) { alert("Failed to update user: " + err.message); }
  };

  // ==========================================
  // פונקציות ניהול משחקים
  // ==========================================
  const handleDeleteGame = async (gameId, title) => {
    if (!window.confirm(`Delete ${title} from DB?`)) return;
    try {
      await API_CALL(`/api/game/${gameId}`, "DELETE");
      setGames(games.filter((g) => g._id !== gameId));
    } catch (err) { alert("Error: " + err.message); }
  };

<<<<<<< HEAD
  const openGameModal = (game) => {
    setGameForm({ 
      _id: game._id, 
      title: game.title || "", 
      description: game.description || "there is no description for this game",
      image: game.image || "https://placehold.co/600x400/1a1a1a/ffffff?text=No+Image+Available",
      requirements: {
        minimum: {
          cpuScore: game.requirements?.minimum?.cpuScore || 0,
          gpuScore: game.requirements?.minimum?.gpuScore || 0,
          ramGb: game.requirements?.minimum?.ramGb || 0,
          cpuText: game.requirements?.minimum?.cpuText || "",
          gpuText: game.requirements?.minimum?.gpuText || ""
        },
        recommended: {
          cpuScore: game.requirements?.recommended?.cpuScore || 0,
          gpuScore: game.requirements?.recommended?.gpuScore || 0,
          ramGb: game.requirements?.recommended?.ramGb || 0,
          cpuText: game.requirements?.recommended?.cpuText || "",
          gpuText: game.requirements?.recommended?.gpuText || ""
        }
      }
    });
=======
  const openGameModal = (game = null) => {
    if (game) {
      setIsEditingGame(true);
      setGameForm({ 
        _id: game._id, 
        title: game.title || "", 
        description: game.description || "there is no description for this game",
        image: game.image || "https://placehold.co/600x400/1a1a1a/ffffff?text=No+Image+Available",
        releasedDate: game.releasedDate || "TBA",
        requirements: {
          minimum: {
            cpuScore: game.requirements?.minimum?.cpuScore || 0,
            gpuScore: game.requirements?.minimum?.gpuScore || 0,
            ramGb: game.requirements?.minimum?.ramGb || 0,
            cpuText: game.requirements?.minimum?.cpuText || "",
            gpuText: game.requirements?.minimum?.gpuText || ""
          },
          recommended: {
            cpuScore: game.requirements?.recommended?.cpuScore || 0,
            gpuScore: game.requirements?.recommended?.gpuScore || 0,
            ramGb: game.requirements?.recommended?.ramGb || 0,
            cpuText: game.requirements?.recommended?.cpuText || "",
            gpuText: game.requirements?.recommended?.gpuText || ""
          }
        }
      });
    } else {
      setIsEditingGame(false);
      setGameForm({ ...defaultGameForm, _id: Date.now() });
    }
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
    setIsGameModalOpen(true);
  };

  const handleSaveGame = async (e) => {
    e.preventDefault();
    try {
<<<<<<< HEAD
      const data = await API_CALL(`/api/game/${gameForm._id}`, "PUT", gameForm);
      if (data.success) {
        setGames(games.map((g) => (g._id === gameForm._id ? { ...g, ...gameForm } : g)));
        setIsGameModalOpen(false);
      }
    } catch (err) { alert("Failed to update game: " + err.message); }
=======
      if (isEditingGame) {
        const data = await API_CALL(`/api/game/${gameForm._id}`, "PUT", gameForm);
        if (data.success) {
          setGames(games.map((g) => (g._id === gameForm._id ? { ...g, ...gameForm } : g)));
        }
      } else {
        const data = await API_CALL(`/api/game/${gameForm._id}`, "POST", gameForm);
        if (data.success) {
          setGames([data.data || { ...gameForm }, ...games]);
        }
      }
      setIsGameModalOpen(false);
    } catch (err) { alert("Failed to save game: " + err.message); }
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
  };

  // ==========================================
  // פונקציות ניהול חומרה
  // ==========================================
  const handleDeleteHardware = async (id, model) => {
    if (!window.confirm(`Delete hardware: ${model}?`)) return;
    try {
      await API_CALL(`/api/hardware/${id}`, "DELETE");
      setHardwares(hardwares.filter((h) => h._id !== id));
    } catch (err) { alert("Error: " + err.message); }
  };

  const openHardwareModal = (hardware = null) => {
    if (hardware) {
      setIsEditing(true); setHardwareForm(hardware);
    } else {
      setIsEditing(false); setHardwareForm({ type: "CPU", brand: "", model: "", benchmarkScore: 0 });
    }
    setIsHardwareModalOpen(true);
  };

  const handleSaveHardware = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const data = await API_CALL(`/api/hardware/${hardwareForm._id}`, "PUT", hardwareForm);
        if (data.success) setHardwares(hardwares.map((h) => (h._id === hardwareForm._id ? data.data : h)));
      } else {
        const data = await API_CALL("/api/hardware", "POST", hardwareForm);
        if (data.success) setHardwares([...hardwares, data.data]);
      }
      setIsHardwareModalOpen(false);
    } catch (err) { alert("Failed to save hardware: " + err.message); }
  };

<<<<<<< HEAD
=======
  // סינונים לחיפוש
  const filteredGames = games.filter(g => g.title?.toLowerCase().includes(gameSearchQuery.toLowerCase()));
  const filteredHardwares = hardwares.filter(h => 
    h.model?.toLowerCase().includes(hardwareSearchQuery.toLowerCase()) || 
    h.brand?.toLowerCase().includes(hardwareSearchQuery.toLowerCase())
  );

>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto min-h-screen relative pb-10">
      <h1 className="text-3xl font-bold text-[#e8eaed] mb-8">
        <span className="text-[#EA4335]">Admin</span> Control Panel
      </h1>

      {/* תפריט הטאבים */}
      <div className="flex gap-4 mb-8 border-b border-[#303134] pb-4 overflow-x-auto">
        {["users", "games", "hardware"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-lg font-medium capitalize whitespace-nowrap ${activeTab === tab ? "bg-[#8ab4f8] text-[#202124]" : "bg-[#303134] text-[#9aa0a6] hover:text-[#e8eaed]"}`}>
            Manage {tab}
          </button>
        ))}
      </div>

      {error && <div className="bg-[#EA4335] text-white p-4 rounded-lg mb-6">{error}</div>}
      {loading && <div className="text-[#9aa0a6] mb-6">Loading {activeTab} data...</div>}

      {/* ==============================================
          טאב משתמשים
      ============================================== */}
      {!loading && activeTab === "users" && (
        <div className="bg-[#303134] rounded-xl border border-[#5f6368] overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#202124] text-[#9aa0a6] border-b border-[#5f6368]">
              <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isOtherAdmin = u.isAdmin && u._id !== currentUser?._id;
                return (
                  <tr key={u._id} className="border-b border-[#5f6368] hover:bg-[#3c4043]">
                    <td className="p-4 text-[#e8eaed]">{u.userName}</td>
                    <td className="p-4 text-[#9aa0a6]">{u.email}</td>
                    <td className="p-4">{u.isAdmin ? <span className="bg-[#fce8e6] text-[#c5221f] px-3 py-1 rounded-full text-xs font-bold">Admin</span> : <span className="bg-[#e6f4ea] text-[#137333] px-3 py-1 rounded-full text-xs font-bold">User</span>}</td>
                    <td className="p-4 flex gap-4">
                      {!isOtherAdmin ? (
                        <button onClick={() => openUserModal(u)} className="text-[#8ab4f8] hover:underline">Edit</button>
                      ) : (<span className="text-[#5f6368] text-sm cursor-not-allowed">Protected</span>)}
                      {!u.isAdmin && (<button onClick={() => handleDeleteUser(u._id, u.userName)} className="text-[#EA4335] hover:underline">Delete</button>)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ==============================================
          טאב משחקים
      ============================================== */}
      {!loading && activeTab === "games" && (
<<<<<<< HEAD
        <div className="bg-[#303134] rounded-xl border border-[#5f6368] overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#202124] text-[#9aa0a6] border-b border-[#5f6368]">
              <tr>
                <th className="p-4">Image</th>
                <th className="p-4">Game Title</th>
                <th className="p-4">Description</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <tr key={g._id} className="border-b border-[#5f6368] hover:bg-[#3c4043]">
                  <td className="p-4">
                    {g.image ? (
                      <img src={g.image} alt={g.title} className="w-16 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-10 bg-[#202124] rounded border border-[#5f6368]"></div>
                    )}
                  </td>
                  <td className="p-4 text-[#e8eaed] font-medium">{g.title}</td>
                  <td className="p-4 text-[#9aa0a6] text-sm max-w-xs truncate">{g.description}</td>
                  <td className="p-4 flex gap-4 items-center h-full mt-2">
                    <button onClick={() => openGameModal(g)} className="text-[#8ab4f8] hover:underline">Edit</button>
                    <button onClick={() => handleDeleteGame(g._id, g.title)} className="text-[#EA4335] hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {games.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-[#9aa0a6]">No games found.</td></tr>}
            </tbody>
          </table>
=======
        <div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button onClick={() => openGameModal()} className="bg-[#34A853] hover:bg-[#2d9047] text-[#202124] px-6 py-2 rounded-lg font-bold transition-colors whitespace-nowrap">
              + Add New Game
            </button>
            <input
              type="text"
              placeholder="Search game title..."
              value={gameSearchQuery}
              onChange={(e) => setGameSearchQuery(e.target.value)}
              className="flex-1 p-2 rounded-lg bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none focus:border-[#8ab4f8]"
            />
          </div>
          
          <div className="bg-[#303134] rounded-xl border border-[#5f6368] overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#202124] text-[#9aa0a6] border-b border-[#5f6368]">
                <tr>
                  <th className="p-4">Image</th>
                  <th className="p-4">Game Title</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGames.map((g) => (
                  <tr key={g._id} className="border-b border-[#5f6368] hover:bg-[#3c4043]">
                    <td className="p-4">
                      {g.image ? (
                        <img src={g.image} alt={g.title} className="w-16 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-16 h-10 bg-[#202124] rounded border border-[#5f6368]"></div>
                      )}
                    </td>
                    <td className="p-4 text-[#e8eaed] font-medium">{g.title}</td>
                    <td className="p-4 text-[#9aa0a6] text-sm max-w-xs truncate">{g.description}</td>
                    <td className="p-4 flex gap-4 items-center h-full mt-2">
                      <button onClick={() => openGameModal(g)} className="text-[#8ab4f8] hover:underline">Edit</button>
                      <button onClick={() => handleDeleteGame(g._id, g.title)} className="text-[#EA4335] hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredGames.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-[#9aa0a6]">No games found matching your search.</td></tr>}
              </tbody>
            </table>
          </div>
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
        </div>
      )}

      {/* ==============================================
          טאב חומרה
      ============================================== */}
      {!loading && activeTab === "hardware" && (
        <div>
<<<<<<< HEAD
          <button onClick={() => openHardwareModal()} className="mb-6 bg-[#34A853] hover:bg-[#2d9047] text-[#202124] px-6 py-2 rounded-lg font-bold transition-colors">
            + Add New Hardware
          </button>
=======
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button onClick={() => openHardwareModal()} className="bg-[#34A853] hover:bg-[#2d9047] text-[#202124] px-6 py-2 rounded-lg font-bold transition-colors whitespace-nowrap">
              + Add New Hardware
            </button>
            <input
              type="text"
              list="hardware-suggestions"
              placeholder="Search hardware by brand or model..."
              value={hardwareSearchQuery}
              onChange={(e) => {
                setHardwareSearchQuery(e.target.value);
                setHardwarePage(1); // איפוס עמוד בחיפוש
              }}
              className="flex-1 p-2 rounded-lg bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none focus:border-[#8ab4f8]"
            />
            {/* HTML Datalist לאוטוקומפליט */}
            <datalist id="hardware-suggestions">
              {hardwares.map(h => {
                // בדיקה: האם המודל כבר מכיל את המותג בהתחלה?
                const displayName = h.model.toLowerCase().startsWith(h.brand.toLowerCase()) 
                  ? h.model 
                  : `${h.brand} ${h.model}`;
                  
                return <option key={h._id} value={displayName} />;
              })}
            </datalist>
          </div>

>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
          <div className="bg-[#303134] rounded-xl border border-[#5f6368] overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#202124] text-[#9aa0a6] border-b border-[#5f6368]">
                <tr><th className="p-4">Type</th><th className="p-4">Brand</th><th className="p-4">Model</th><th className="p-4">Score</th><th className="p-4">Actions</th></tr>
              </thead>
              <tbody>
<<<<<<< HEAD
                {hardwares.map((h) => (
=======
                {/* עימוד החומרה */}
                {filteredHardwares
                  .slice((hardwarePage - 1) * hardwareItemsPerPage, hardwarePage * hardwareItemsPerPage)
                  .map((h) => (
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
                  <tr key={h._id} className="border-b border-[#5f6368] hover:bg-[#3c4043]">
                    <td className="p-4 font-bold text-[#8ab4f8]">{h.type}</td>
                    <td className="p-4 text-[#e8eaed]">{h.brand}</td>
                    <td className="p-4 text-[#9aa0a6]">{h.model}</td>
                    <td className="p-4 text-[#34A853]">{h.benchmarkScore}</td>
                    <td className="p-4 flex gap-4">
                      <button onClick={() => openHardwareModal(h)} className="text-[#8ab4f8] hover:underline">Edit</button>
                      <button onClick={() => handleDeleteHardware(h._id, h.model)} className="text-[#EA4335] hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
<<<<<<< HEAD
              </tbody>
            </table>
=======
                {filteredHardwares.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-[#9aa0a6]">No hardware found matching your search.</td></tr>}
              </tbody>
            </table>
            
            {/* סרגל ניווט עמודים לחומרה */}
            {filteredHardwares.length > hardwareItemsPerPage && (
              <div className="flex items-center justify-between p-4 bg-[#202124] border-t border-[#5f6368]">
                <button
                  onClick={() => setHardwarePage(prev => Math.max(prev - 1, 1))}
                  disabled={hardwarePage === 1}
                  className="px-4 py-2 bg-[#303134] text-[#e8eaed] rounded-lg disabled:opacity-50 hover:bg-[#3c4043] transition-colors"
                >
                  Previous
                </button>
                <span className="text-[#9aa0a6] font-medium">
                  Page {hardwarePage} of {Math.ceil(filteredHardwares.length / hardwareItemsPerPage)}
                </span>
                <button
                  onClick={() => setHardwarePage(prev => Math.min(prev + 1, Math.ceil(filteredHardwares.length / hardwareItemsPerPage)))}
                  disabled={hardwarePage === Math.ceil(filteredHardwares.length / hardwareItemsPerPage)}
                  className="px-4 py-2 bg-[#303134] text-[#e8eaed] rounded-lg disabled:opacity-50 hover:bg-[#3c4043] transition-colors"
                >
                  Next
                </button>
              </div>
            )}
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
          </div>
        </div>
      )}

      {/* ==============================================
          מודלים (Modals)
      ============================================== */}

      {/* מודל עריכת משתמש */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#202124] p-8 rounded-xl border border-[#5f6368] w-full max-w-md shadow-2xl my-8">
            <h2 className="text-2xl text-[#e8eaed] mb-6 font-bold">Edit User</h2>
            <form onSubmit={handleSaveUser} className="flex flex-col gap-4">
              <label className="text-[#9aa0a6] text-sm mb-[-10px]">Username</label>
              <input type="text" required value={userForm.userName} onChange={(e) => setUserForm({ ...userForm, userName: e.target.value })} className="p-3 rounded-lg bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none" />
              
              <label className="text-[#9aa0a6] text-sm mb-[-10px]">Email</label>
              <input type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="p-3 rounded-lg bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none" />
              
              <label className="text-[#9aa0a6] text-sm mb-[-10px]">Change Password</label>
              <input type="password" placeholder="Leave blank to keep current password" value={userForm.newPassword} onChange={(e) => setUserForm({ ...userForm, newPassword: e.target.value })} className="p-3 rounded-lg bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none" />
              
              <label className="flex items-center gap-3 text-[#e8eaed] mt-2 cursor-pointer p-2 bg-[#303134] rounded-lg border border-[#5f6368] hover:bg-[#3c4043] transition-colors">
                <input type="checkbox" checked={userForm.isAdmin} onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })} className="w-5 h-5 accent-[#8ab4f8]" />
                <span className="font-medium">Grant Admin Privileges</span>
              </label>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-5 py-2 rounded-lg text-[#9aa0a6] hover:bg-[#303134] transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#8ab4f8] text-[#202124] font-bold rounded-lg hover:bg-[#aecbfa]">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* מודל עריכת משחק (מלא!) */}
      {isGameModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#202124] p-6 rounded-xl border border-[#5f6368] w-full max-w-4xl shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
<<<<<<< HEAD
            <h2 className="text-2xl text-[#e8eaed] mb-6 font-bold">Edit Game & Requirements</h2>
=======
            <h2 className="text-2xl text-[#e8eaed] mb-6 font-bold">{isEditingGame ? "Edit Game & Requirements" : "Add New Game"}</h2>
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
            
            <form onSubmit={handleSaveGame} className="flex flex-col gap-6">
              
              {/* פרטים כלליים */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<<<<<<< HEAD
                <div className="flex flex-col gap-2">
                  <label className="text-[#8ab4f8] font-bold">Game Title</label>
                  <input type="text" required value={gameForm.title} onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })} className="p-2 rounded bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[#8ab4f8] font-bold">Image URL</label>
                  <input type="text" required value={gameForm.image} onChange={(e) => setGameForm({ ...gameForm, image: e.target.value })} className="p-2 rounded bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none" />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[#8ab4f8] font-bold">Description</label>
                  <textarea rows="2" required value={gameForm.description} onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })} className="p-2 rounded bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none resize-none" />
=======
                
                {/* הצגת שדה ID רק אם זה משחק חדש */}
                {!isEditingGame && (
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[#8ab4f8] font-bold">Game ID (Number)</label>
                    <input type="number" required value={gameForm._id} onChange={(e) => setGameForm({ ...gameForm, _id: Number(e.target.value) })} className="p-2 rounded bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none focus:border-[#8ab4f8]" />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-[#8ab4f8] font-bold">Game Title</label>
                  <input type="text" required value={gameForm.title} onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })} className="p-2 rounded bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none focus:border-[#8ab4f8]" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[#8ab4f8] font-bold">Image URL</label>
                  <input type="text" required value={gameForm.image} onChange={(e) => setGameForm({ ...gameForm, image: e.target.value })} className="p-2 rounded bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none focus:border-[#8ab4f8]" />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[#8ab4f8] font-bold">Release Date</label>
                  <input type="text" required value={gameForm.releasedDate} onChange={(e) => setGameForm({ ...gameForm, releasedDate: e.target.value })} placeholder="e.g. 2024-05-12 or TBA" className="p-2 rounded bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none focus:border-[#8ab4f8]" />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[#8ab4f8] font-bold">Description</label>
                  <textarea rows="2" required value={gameForm.description} onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })} className="p-2 rounded bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none resize-none focus:border-[#8ab4f8]" />
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
                </div>
              </div>

              <hr className="border-[#5f6368]" />

              {/* דרישות מערכת */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* מינימום */}
                <div className="flex flex-col gap-3 bg-[#303134] p-4 rounded-lg border border-[#5f6368]">
                  <h3 className="text-lg text-[#f28b82] font-bold">Minimum Requirements</h3>
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">CPU Score</label>
<<<<<<< HEAD
                  <input type="number" required value={gameForm.requirements.minimum.cpuScore} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, minimum: { ...gameForm.requirements.minimum, cpuScore: Number(e.target.value) } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">GPU Score</label>
                  <input type="number" required value={gameForm.requirements.minimum.gpuScore} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, minimum: { ...gameForm.requirements.minimum, gpuScore: Number(e.target.value) } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">RAM (GB)</label>
                  <input type="number" required value={gameForm.requirements.minimum.ramGb} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, minimum: { ...gameForm.requirements.minimum, ramGb: Number(e.target.value) } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">CPU Text (Display)</label>
                  <input type="text" required value={gameForm.requirements.minimum.cpuText} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, minimum: { ...gameForm.requirements.minimum, cpuText: e.target.value } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">GPU Text (Display)</label>
                  <input type="text" required value={gameForm.requirements.minimum.gpuText} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, minimum: { ...gameForm.requirements.minimum, gpuText: e.target.value } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368]" />
=======
                  <input type="number" required value={gameForm.requirements.minimum.cpuScore} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, minimum: { ...gameForm.requirements.minimum, cpuScore: Number(e.target.value) } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368] focus:border-[#8ab4f8]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">GPU Score</label>
                  <input type="number" required value={gameForm.requirements.minimum.gpuScore} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, minimum: { ...gameForm.requirements.minimum, gpuScore: Number(e.target.value) } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368] focus:border-[#8ab4f8]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">RAM (GB)</label>
                  <input type="number" required value={gameForm.requirements.minimum.ramGb} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, minimum: { ...gameForm.requirements.minimum, ramGb: Number(e.target.value) } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368] focus:border-[#8ab4f8]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">CPU Text (Display)</label>
                  <input type="text" required value={gameForm.requirements.minimum.cpuText} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, minimum: { ...gameForm.requirements.minimum, cpuText: e.target.value } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368] focus:border-[#8ab4f8]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">GPU Text (Display)</label>
                  <input type="text" required value={gameForm.requirements.minimum.gpuText} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, minimum: { ...gameForm.requirements.minimum, gpuText: e.target.value } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368] focus:border-[#8ab4f8]" />
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
                </div>

                {/* מומלץ */}
                <div className="flex flex-col gap-3 bg-[#303134] p-4 rounded-lg border border-[#5f6368]">
                  <h3 className="text-lg text-[#81c995] font-bold">Recommended Requirements</h3>
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">CPU Score</label>
<<<<<<< HEAD
                  <input type="number" required value={gameForm.requirements.recommended.cpuScore} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, recommended: { ...gameForm.requirements.recommended, cpuScore: Number(e.target.value) } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">GPU Score</label>
                  <input type="number" required value={gameForm.requirements.recommended.gpuScore} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, recommended: { ...gameForm.requirements.recommended, gpuScore: Number(e.target.value) } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">RAM (GB)</label>
                  <input type="number" required value={gameForm.requirements.recommended.ramGb} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, recommended: { ...gameForm.requirements.recommended, ramGb: Number(e.target.value) } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">CPU Text (Display)</label>
                  <input type="text" required value={gameForm.requirements.recommended.cpuText} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, recommended: { ...gameForm.requirements.recommended, cpuText: e.target.value } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">GPU Text (Display)</label>
                  <input type="text" required value={gameForm.requirements.recommended.gpuText} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, recommended: { ...gameForm.requirements.recommended, gpuText: e.target.value } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368]" />
=======
                  <input type="number" required value={gameForm.requirements.recommended.cpuScore} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, recommended: { ...gameForm.requirements.recommended, cpuScore: Number(e.target.value) } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368] focus:border-[#8ab4f8]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">GPU Score</label>
                  <input type="number" required value={gameForm.requirements.recommended.gpuScore} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, recommended: { ...gameForm.requirements.recommended, gpuScore: Number(e.target.value) } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368] focus:border-[#8ab4f8]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">RAM (GB)</label>
                  <input type="number" required value={gameForm.requirements.recommended.ramGb} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, recommended: { ...gameForm.requirements.recommended, ramGb: Number(e.target.value) } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368] focus:border-[#8ab4f8]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">CPU Text (Display)</label>
                  <input type="text" required value={gameForm.requirements.recommended.cpuText} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, recommended: { ...gameForm.requirements.recommended, cpuText: e.target.value } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368] focus:border-[#8ab4f8]" />
                  
                  <label className="text-[#9aa0a6] text-xs mb-[-8px]">GPU Text (Display)</label>
                  <input type="text" required value={gameForm.requirements.recommended.gpuText} onChange={(e) => setGameForm({ ...gameForm, requirements: { ...gameForm.requirements, recommended: { ...gameForm.requirements.recommended, gpuText: e.target.value } } })} className="p-2 rounded bg-[#202124] text-[#e8eaed] outline-none border border-[#5f6368] focus:border-[#8ab4f8]" />
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsGameModalOpen(false)} className="px-5 py-2 rounded-lg text-[#9aa0a6] hover:bg-[#303134] transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#8ab4f8] text-[#202124] font-bold rounded-lg hover:bg-[#aecbfa]">Save Game Details</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* מודל עריכת/הוספת חומרה */}
      {isHardwareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#202124] p-8 rounded-xl border border-[#5f6368] w-full max-w-md shadow-2xl my-8">
            <h2 className="text-2xl text-[#e8eaed] mb-6 font-bold">{isEditing ? "Edit Hardware" : "Add New Hardware"}</h2>
            <form onSubmit={handleSaveHardware} className="flex flex-col gap-4">
              <select value={hardwareForm.type} onChange={(e) => setHardwareForm({ ...hardwareForm, type: e.target.value })} className="p-3 rounded-lg bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none">
                <option value="CPU">CPU (Processor)</option><option value="GPU">GPU (Graphics Card)</option>
              </select>
              <input type="text" placeholder="Brand" required value={hardwareForm.brand} onChange={(e) => setHardwareForm({ ...hardwareForm, brand: e.target.value })} className="p-3 rounded-lg bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none" />
              <input type="text" placeholder="Model" required value={hardwareForm.model} onChange={(e) => setHardwareForm({ ...hardwareForm, model: e.target.value })} className="p-3 rounded-lg bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none" />
              <input type="number" placeholder="Benchmark Score" required value={hardwareForm.benchmarkScore} onChange={(e) => setHardwareForm({ ...hardwareForm, benchmarkScore: Number(e.target.value) })} className="p-3 rounded-lg bg-[#303134] text-[#e8eaed] border border-[#5f6368] outline-none" />
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsHardwareModalOpen(false)} className="px-5 py-2 rounded-lg text-[#9aa0a6] hover:bg-[#303134] transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#8ab4f8] text-[#202124] font-bold rounded-lg hover:bg-[#aecbfa]">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}