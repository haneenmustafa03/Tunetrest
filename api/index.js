const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "25mb" })); // Support large base64 uploads

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Song analysis endpoint
app.post("/song", async (req, res) => {
  try {
    const { imageUrls } = req.body;
    console.log("Received request with URLs:", imageUrls?.length || 0);

    if (!imageUrls || imageUrls.length === 0) {
      return res.status(400).json({ error: "No image URLs or files provided." });
    }

    // Clean + filter images
    const validImages = [...new Set(imageUrls)] // remove duplicates
      .filter((item) => {
        if (typeof item !== "string") return false;

        // Accept URLs (http/https) or base64-encoded images
        if (item.startsWith("http")) {
          return item.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i);
        }
        if (item.startsWith("data:image/")) return true; // base64 valid
        return false;
      })
      .slice(0, 5); // limit to 5 total

    if (validImages.length === 0) {
      return res.status(400).json({
        error:
          "No valid images detected. Provide URLs or upload image files (JPG, PNG, WEBP).",
      });
    }

    // Check if OpenAI API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OpenAI key");
      return res.status(500).json({ error: "OpenAI API key not configured." });
    }

    console.log("Making OpenAI API request...");

    const imageAnalysisPrompt = `Analyze the given image(s) and return only JSON describing its vibe.
    Fields:
    - aesthetic: short label (e.g., cottagecore, minimalism, streetwear)
    - mood: comma-separated adjectives
    - recommended_song: suggest a song that fits the vibe
      - song_name
      - artist
    Return ONLY valid JSON:
    {
      "aesthetic": "",
      "mood": "",
      "recommended_song": { "song_name": "", "artist": "" }
    }`;

    // Send both URLs and base64 to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: imageAnalysisPrompt },
            ...validImages.map((img) => ({
              type: "image_url",
              image_url: { url: img },
            })),
          ],
        },
      ],
      max_tokens: 500,
    });

    console.log("Received OpenAI response.");
    let clean = response.choices[0].message.content.trim();

    // Remove any Markdown code fences like ```json ... ```
    clean = clean.replace(/```json\s*/i, "").replace(/```$/, "").trim();

    // Extra safety: if the model wrapped it in backticks or stray characters
    if (clean.startsWith("```")) clean = clean.slice(3).trim();
    if (clean.endsWith("```")) clean = clean.slice(0, -3).trim();

    const analysis = JSON.parse(clean);
    const rec = analysis.recommended_song;

    // If we got a song, try to find it on Spotify
    if (rec?.song_name && rec?.artist) {
      const track = await searchSpotifyTrack(rec.song_name, rec.artist);
      if (track) {
        analysis.recommended_song = {
          name: track.name,
          artist: track.artists.map((a) => a.name).join(", "),
          preview_url: track.preview_url,
          spotify_url: track.external_urls.spotify,
          album_image: track.album.images[0]?.url,
        };
      } else {
        analysis.recommended_song = { name: "No Match Found" };
      }
    } else {
      analysis.recommended_song = { name: "No Match Found" };
    }

    res.json(analysis);
  } catch (error) {
    console.error("Detailed error:", error);
    res
      .status(500)
      .json({ error: "Failed to analyze images", details: error.message });
  }
});

// ===== Spotify token route =====
app.get("/spotify-token", async (req, res) => {
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
    if (!data.access_token)
      return res.status(400).json({ error: "Spotify token fetch failed" });

    res.json({ access_token: data.access_token });
  } catch (error) {
    console.error("Spotify token error:", error);
    res.status(500).json({ error: "Spotify token error" });
  }
});

// ===== Spotify track search =====
async function searchSpotifyTrack(songName, artist) {
  try {
    const tokenRes = await fetch("http://localhost:8787/spotify-token");
    const { access_token } = await tokenRes.json();

    if (!access_token) throw new Error("Failed to get Spotify token");

    const query = `track:${songName} artist:${artist}`;
    const spotifyRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=track&limit=1`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    if (!spotifyRes.ok) throw new Error("Spotify API error");
    const data = await spotifyRes.json();
    return data.tracks.items[0];
  } catch (err) {
    console.error("Spotify search error:", err);
    return null;
  }
}

// ===== Server Setup =====
const PORT = 8787;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
