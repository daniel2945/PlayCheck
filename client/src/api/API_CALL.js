const API_CALL = async (endpoint, method = "GET", body = null) => {
  const BASE_URL = "http://localhost:3000";
  const token = localStorage.getItem("token"); // תיקון: שליפה ישירה של הטוקן

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }), // הזרקת טוקן אם קיים
    },
  };

  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    
    // אם השרת מחזיר דף שגיאה שאינו JSON (כמו 404 של HTML)
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server error: Not a JSON response");
    }

    const data = await res.json();

    if (!res.ok) {
      // תיקון: חיפוש הודעת השגיאה בכל השדות האפשריים (message, error, data)
      const errorMsg = data.message || data.error || data.data || "Request failed";
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error("API Error:", err.message);
    throw err;
  }
};

export default API_CALL;