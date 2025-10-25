import dotenv from "dotenv";
import express from 'express'; // lightweight web server framework to help define routes
import cors from 'cors'; // frontend to call backend
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/song", async (req, res) => {
  const { imageUrls = [] } = req.body;

  try {
    const resp = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Analyze the following images and respond ONLY in JSON with: " +
                "mood, genre, valence(0-1), energy(0-1), tempo(60-180).",
            },
            ...imageUrls.map((url) => ({
              type: "image_url",
              image_url: { url },
            })),
          ],
        },
      ],
    });

    const text = (resp.output_text || "").replace(/^```json|```$/g, "").trim();
    const vibe = JSON.parse(text);

    res.json(vibe);
  } catch (err) {
    console.error("Error analyzing images:", err);
    res.status(500).json({ error: "failed_to_analyze_images" });
  }
});
