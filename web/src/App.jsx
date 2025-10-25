import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [urls, setUrls] = useState(["", "", "", "", ""]);
  const [vibe, setVibe] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    const imageUrls = urls.filter(Boolean);
    if (imageUrls.length === 0) {
      alert("Please enter at least one image URL!");
      return;
    }

    setLoading(true);
    setVibe(null);

    try {
      const res = await axios.post("http://localhost:8787/song", { imageUrls });
      setVibe(res.data);
    } catch (err) {
      console.error(err);
      alert("Error analyzing images. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-extrabold text-white mb-8 drop-shadow-lg">
        🎧 Image → Vibe Analyzer
      </h1>

      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
        <p className="text-gray-700 mb-3">Paste up to 5 image URLs:</p>

        {/* Input fields */}
        <div className="flex flex-col gap-2 mb-4">
          {urls.map((url, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Image URL #${i + 1}`}
              value={url}
              onChange={(e) => {
                const updated = [...urls];
                updated[i] = e.target.value;
                setUrls(updated);
              }}
              className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-400 outline-none"
            />
          ))}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold w-full py-2 rounded-md transition duration-200"
        >
          {loading ? "Analyzing..." : "Analyze Vibe"}
        </button>
      </div>

      {/* Results */}
      {vibe && (
        <div className="bg-white rounded-2xl shadow-xl mt-8 p-6 w-full max-w-lg">
          <h2 className="text-xl font-bold mb-2 text-gray-800">✨ AI Results</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto text-gray-700">
            {JSON.stringify(vibe, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
