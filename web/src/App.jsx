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
          <h1 className="text-6xl font-extrabold text-white">Tunetrest</h1>
          <p className="text-xl text-gray-200">
            Discover playlists through images
          </p>
        </div>

        {!results ? (
          <div className="rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto bg-gray-900/60 backdrop-blur-md">
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
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white transition"
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

            {/* Error message */}
            {error && (
              <div className="text-red-400 text-sm mb-4 bg-red-900/20 p-2 rounded-lg">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-white text-black font-bold py-4 rounded-lg transition text-lg shadow-lg disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Get My Playlist"}
            </button>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Your Personalized Song Recommendation
            </h2>

            <div className="bg-white/20 rounded-lg p-6 text-white space-y-2">
              <p>
                <strong>Aesthetic:</strong> {results.aesthetic}
              </p>
              <p>
                <strong>Mood:</strong> {results.mood}
              </p>

              {results.recommended_song && (
                <div className="mt-4">
                  <p className="text-lg font-semibold text-pink-400">
                    🎵 {results.recommended_song.name}
                  </p>
                  <p className="text-sm text-gray-300">
                    {results.recommended_song.artist}
                  </p>

                  {results.recommended_song.album_image && (
                    <img
                      src={results.recommended_song.album_image}
                      alt="Album cover"
                      className="mt-4 w-32 h-32 rounded-lg"
                    />
                  )}

                  {results.recommended_song.spotify_url && (
                    <a
                      href={results.recommended_song.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition"
                    >
                      Open on Spotify
                    </a>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              className="w-full mt-8 bg-white/20 text-white font-bold py-4 rounded-lg hover:bg-white/30 transition text-lg"
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
