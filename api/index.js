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
          - spotify_params: 
            - valence (0–1)
            - energy (0–1)
            - danceability (0–1)
            - tempo_range [min, max] in BPM

          Return ONLY valid JSON in this format:
          {
            "aesthetic": "",
            "mood": "",
            "spotify_params": {
              "valence": 0,
              "energy": 0,
              "danceability": 0,
              "tempo_range": [0, 0]
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
        res.json(analysis);

    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data // For axios errors
        });
        
        res.status(500).json({ 
            error: 'Failed to analyze images',
            details: error.message,
            type: error.constructor.name
        });
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