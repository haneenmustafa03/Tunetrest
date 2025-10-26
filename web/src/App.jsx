import { useState } from "react";
import axios from "axios";
import { Link } from "lucide-react";
import Lottie from "lottie-react";
import animationData from "./assets/SoundAnimation.json";

function BackgroundAnimation() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

function App() {
  const [imageUrls, setImageUrls] = useState(["", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleUrlChange = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const handleSubmit = async () => {
    const validUrls = imageUrls.filter((url) => url.trim() !== "");
    if (validUrls.length === 0) {
      setError("Please enter at least one image URL");
      return;
    }

    setLoading(true);
    setResults(null);
    setError(null);

    try {
      const res = await axios.post("http://localhost:8787/song", {
        imageUrls: validUrls,
      });

      console.log("Analysis result:", res.data);
      setResults(res.data);
    } catch (err) {
      console.error("Request failed:", err);
      if (err.response) {
        setError(err.response.data.error || "Server error occurred.");
      } else {
        setError("Could not connect to backend. Is it running on port 8787?");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImageUrls(["", "", "", "", ""]);
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4 relative overflow-hidden">
      <BackgroundAnimation />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
            Tunetrest
          </h1>
          <p className="text-xl text-gray-300">
            Discover playlists through images
          </p>
        </div>

        {/* ===== INPUT MODE ===== */}
        {!results ? (
          <div className="rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto bg-gray-900/70 backdrop-blur-md">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Link className="w-6 h-6" />
              Paste Your Image URLs
            </h2>

            <div className="space-y-3 mb-6">
              {imageUrls.map((url, index) => (
                <div key={index}>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder={`Image URL ${index + 1}`}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400 transition"
                  />
                  {url && (
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="mt-2 w-24 h-24 object-cover rounded-lg border-2 border-white/30"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="text-red-400 text-sm mb-4 bg-red-900/20 p-2 rounded-lg">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 text-white font-bold py-4 rounded-lg transition text-lg shadow-lg disabled:opacity-50 hover:from-pink-500 hover:to-indigo-500"
            >
              {loading ? "Analyzing..." : "Get My Playlist"}
            </button>
          </div>
        ) : (
          /* ===== RESULTS MODE ===== */
          <div className="bg-gradient-to-b from-gray-800/70 to-gray-900/90 backdrop-blur-lg rounded-2xl p-8 shadow-2xl text-white">
            {/* Show user's input images */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-4 text-gray-100">
                You wanted images for...
              </h3>
              <div className="flex flex-wrap gap-4 justify-center">
                {imageUrls
                  .filter((url) => url.trim() !== "")
                  .map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`User input ${i + 1}`}
                      className="w-24 h-24 rounded-lg border-2 border-white/20 object-cover shadow-md"
                    />
                  ))}
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-center text-white drop-shadow-md">
              Your Personalized Song Recommendation
            </h2>

            <div className="rounded-xl p-6 bg-gradient-to-br from-gray-700/60 to-gray-800/90 shadow-inner space-y-3 text-center">
              <p className="text-lg">
                <strong className="text-gray-300">Aesthetic:</strong>{" "}
                <span className="text-pink-300 font-medium">
                  {results.aesthetic}
                </span>
              </p>
              <p className="text-lg">
                <strong className="text-gray-300">Mood:</strong>{" "}
                <span className="text-pink-300 font-medium">{results.mood}</span>
              </p>

              {results.recommended_song && (
                <div className="mt-6 flex flex-col items-center">
                  <p className="text-2xl font-semibold text-pink-400 flex items-center gap-2">
                    🎵 {results.recommended_song.name}
                  </p>
                  <p className="text-sm text-gray-300">
                    {results.recommended_song.artist}
                  </p>

                  {results.recommended_song.album_image && (
                    <img
                      src={results.recommended_song.album_image}
                      alt="Album cover"
                      className="mt-4 w-40 h-40 rounded-lg shadow-lg border-2 border-white/10"
                    />
                  )}

                  {/* --- Spotify Preview Player --- */}
                  {results.recommended_song.preview_url && (
                    <div className="mt-4">
                      <audio
                        controls
                        src={results.recommended_song.preview_url}
                        className="w-full max-w-sm mx-auto mt-3 rounded-lg"
                      >
                        Your browser does not support the audio element.
                      </audio>
                      <p className="text-sm text-gray-400 mt-1">
                        🎧 30-second preview
                      </p>
                    </div>
                  )}

                  {results.recommended_song.spotify_url && (
                    <a
                      href={results.recommended_song.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-5 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold py-2 px-6 rounded-lg hover:from-green-500 hover:to-emerald-600 transition"
                    >
                      Open on Spotify
                    </a>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              className="w-full mt-10 bg-white/10 text-white font-bold py-4 rounded-lg hover:bg-white/20 transition text-lg"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
