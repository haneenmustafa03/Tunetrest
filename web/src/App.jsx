import { useState } from 'react';
import { Music, Link, Sparkles } from 'lucide-react';

function App() {
  const [imageUrls, setImageUrls] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleUrlChange = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const handleSubmit = async () => {
    // Filter out empty URLs
    const validUrls = imageUrls.filter(url => url.trim() !== '');
    
    if (validUrls.length === 0) {
      alert('Please enter at least one image URL');
      return;
    }

    setLoading(true);
    
    try {
      // Replace with your actual backend endpoint
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images: validUrls }),
      });
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to fetch recommendations. Make sure backend is running!');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImageUrls(['', '', '', '', '']);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="w-12 h-12 text-pink-400" />
            <h1 className="text-6xl font-extrabold text-white">Tunetrest</h1>
            <Sparkles className="w-12 h-12 text-yellow-400" />
          </div>
          <p className="text-xl text-gray-300">Discover playlists through your images</p>
        </div>

        {!results ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Link className="w-6 h-6" />
              Paste Your Image URLs
            </h2>
            
            <div className="space-y-4 mb-8">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder={`Image URL ${index + 1}`}
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-pink-400 transition"
                  />
                  {url && (
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`}
                      className="mt-2 w-24 h-24 object-cover rounded-lg border-2 border-white/30"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-400 to-purple-600 text-white font-bold py-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg"
            >
              {loading ? 'Analyzing...' : 'Get My Playlist 🎵'}
            </button>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Your Personalized Playlist</h2>
            
            <div className="space-y-3 mb-8">
              {results.songs?.map((song, index) => (
                <div key={index} className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-pink-400">{index + 1}</span>
                    <div>
                      <p className="text-lg font-semibold text-white">{song.name || song}</p>
                      {song.artist && <p className="text-sm text-gray-300">{song.artist}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-white/20 text-white font-bold py-4 rounded-lg hover:bg-white/30 transition text-lg"
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