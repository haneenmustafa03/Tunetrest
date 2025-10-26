const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Song analysis endpoint
app.post('/song', async (req, res) => {
    try {
        const { imageUrls } = req.body;
        console.log('Received request with URLs:', imageUrls); // Debug log

        if (!imageUrls || imageUrls.length === 0) {
            return res.status(400).json({ error: 'No image URLs provided' });
        }

        // Clean and validate URLs
        const validUrls = [...new Set(imageUrls)] // Remove duplicates
            .filter(url => {
                try {
                    if (typeof url !== 'string') return false;
                    const cleanUrl = url.split('?')[0]; // Remove query parameters
                    return cleanUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i);
                } catch {
                    return false;
                }
            })
            .slice(0, 5); // Limit to 5 images

        if (validUrls.length === 0) {
            return res.status(400).json({ error: 'No valid image URLs provided. URLs must be complete and point to image files (jpg, jpeg, png, webp, or gif).' });
        }

        console.log('Valid URLs after cleaning:', validUrls); // Debug log

        // Verify each URL is accessible
        try {
            await Promise.all(validUrls.map(async url => {
                const response = await fetch(url, { method: 'HEAD' });
                if (!response.ok || !response.headers.get('content-type')?.includes('image/')) {
                    throw new Error(`Invalid image URL: ${url}`);
                }
            }));
        } catch (error) {
            return res.status(400).json({ 
                error: 'One or more image URLs are not accessible or not valid image files.',
                details: error.message
            });
        }

        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY) {
            console.error('OpenAI API key is not configured');
            return res.status(500).json({ error: 'OpenAI API key is not configured' });
        }

        console.log('Making OpenAI API request...'); // Debug log
        const imageAnalysisPrompt = `Analyze the given image and return only JSON describing its vibe.
          Fields:
          - aesthetic: short label (e.g., cottagecore, minimalism, streetwear)
          - mood: comma-separated adjectives
          - recommended_song: suggest a song that fits the vibe
            - song_name: the song title
            - artist: the artist name

          Return ONLY valid JSON in this format:
          {
            "aesthetic": "",
            "mood": "",
            "recommended_song": {
              "song_name": "",
              "artist": ""
            }
          }`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: imageAnalysisPrompt },
                        ...validUrls.map(url => ({
                            type: "image_url",
                            image_url: {
                                url: url
                            }
                        }))
                    ]
                }
            ],
            max_tokens: 500
        });

        console.log('Received OpenAI response:', response.choices[0].message.content); // Debug log

        // Clean the response by removing markdown code block markers and parse JSON
        const cleanResponse = response.choices[0].message.content
            .replace(/```json\n?/, '') // Remove opening ```json
            .replace(/```$/, '')       // Remove closing ```
            .trim();                   // Remove any extra whitespace

        const analysis = JSON.parse(cleanResponse);
        const recommendedSong = analysis.recommended_song;
        if (recommendedSong?.song_name && recommendedSong?.artist) {
          const track = await searchSpotifyTrack(recommendedSong.song_name, recommendedSong.artist);
          if (track) {
            analysis.recommended_song = {
              name: track.name,
              artist: track.artists.map(a => a.name).join(", "),
              preview_url: track.preview_url,
              spotify_url: track.external_urls.spotify,
              album_image: track.album.images[0]?.url
            };
          }
        }

        res.json(analysis);

      } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({ error: 'Failed to analyze images', details: error.message });
      }
    });

// Basic error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ 
        error: 'Something went wrong!',
        details: err.message
    });
});

const PORT = 8787;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('OpenAI API Key configured:', !!process.env.OPENAI_API_KEY); // Debug log
});

app.get('/spotify-token', async (req, res) => { // basically spotify authentication service 
  try {
    const resToken = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });

    const data = await resToken.json();
    console.log("spotify token response:", data);

    if (!data.access_token) {
      console.error("Spotify auth failed:", data);
      return res.status(400).json({ error: "Failed to get Spotify token", details: data });
    }

    console.log("✅ Spotify token acquired:", data.access_token.substring(0, 20) + "...");
    res.json({ access_token: data.access_token });
  } catch (error) {
    console.error("Spotify token error:", error);
    res.status(500).json({ error: "Failed to get Spotify token", details: error.message });
  }
});

// Helper: search Spotify for a track by name and artist
async function searchSpotifyTrack(songName, artist) {
    try {
        // Step 1: Get Spotify token
        const tokenRes = await fetch("http://localhost:8787/spotify-token");
        const { access_token } = await tokenRes.json();

        if (!access_token) throw new Error("Failed to get Spotify token");

        // Step 2: Search Spotify for the track
        const query = `track:${songName} artist:${artist}`;
        const spotifyRes = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        if (!spotifyRes.ok) {
            const errText = await spotifyRes.text();
            throw new Error(`Spotify API error: ${spotifyRes.status} ${errText}`);
        }

        const data = await spotifyRes.json();
        return data.tracks.items[0]; // return first match
    } catch (err) {
        console.error("Spotify search error:", err);
        return null;
    }
}

