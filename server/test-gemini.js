require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const testGeminiAPI = async () => {
  try {
    console.log("🔍 Checking for GEMINI_API_KEY in .env...");
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing from your .env file.");
    }

    console.log("✅ API Key found. Initializing Gemini SDK...");
    const genAI = new GoogleGenerativeAI(apiKey);

    // Initializing the exact same model used in your hardwareParser.js
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = "Respond with the word SUCCESS if you can read this.";
    console.log(`🚀 Sending prompt: "${prompt}"\n`);

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("✅ AI RAW RESPONSE:");
    console.log("-----------------------------------------");
    console.log(responseText.trim());
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("\n❌ AI ENRICHMENT TEST FAILED! ERROR DETAILS:");
    console.error(error.message || error);
  }
};

testGeminiAPI();
