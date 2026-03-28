import { GoogleGenAI, Type } from '@google/genai';

const getAiInstance = (apiKey?: string) => {
  const key = apiKey || (process.env as any).GEMINI_API_KEY;
  if (!key) {
    console.warn('GEMINI_API_KEY is missing. AI features will not work.');
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
};

const defaultAi = getAiInstance();

export interface TrendingNiche {
  id: string;
  name: string;
  platform: 'instagram' | 'youtube' | 'both';
  description: string;
  trendScore: number;
  reason: string;
  source: string;
  examples: {
    title: string;
    description: string;
    url: string;
  }[];
}

export interface ViralScript {
  niche: string;
  platform: string;
  content: string;
  tags: string[];
  tools: {
    name: string;
    type: 'free' | 'paid';
    url: string;
    description: string;
  }[];
  watermarkTips: string;
  imagePrompt: string;
}

export async function getTrendingNiches(customApiKey?: string): Promise<TrendingNiche[]> {
  const aiInstance = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : defaultAi;
  if (!aiInstance) {
    console.error("AI instance not initialized. Check your API key.");
    return [];
  }
  const prompt = `
    Act as a world-class social media strategist and trend analyst. 
    Analyze the current digital landscape across Instagram Reels and YouTube Shorts to identify the top 6 high-growth, viral-potential niches.
    
    Use Google Search to anchor your analysis in real-time data, looking for:
    - Rapidly rising search queries related to content creation.
    - New content formats gaining massive traction (e.g., specific editing styles, audio trends).
    - Underserved but high-engagement communities.

    For each niche, provide:
    - A compelling, professional name.
    - Primary platform (instagram, youtube, or both).
    - A detailed breakdown of the content's visual and auditory signature.
    - A data-backed Trend Score (0-100) based on velocity and engagement.
    - A strategic "Why it's viral" analysis (psychological triggers, algorithm favor).
    - The specific data source or trend indicator.
    - 2 high-fidelity examples of successful content.
    - IMPORTANT: Provide ONLY valid, working URLs to real viral videos or specific search results. NO placeholders.
  `;

  try {
    console.log(`Fetching trending niches with search grounding ${customApiKey ? '(using custom API)' : ''}...`);
    const response = await aiInstance.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique slug for the niche" },
              name: { type: Type.STRING },
              platform: { type: Type.STRING, enum: ['instagram', 'youtube', 'both'] },
              description: { type: Type.STRING },
              trendScore: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              source: { type: Type.STRING, description: "The API or data source used" },
              examples: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    url: { type: Type.STRING, description: "A valid, working URL to a real video or search result" }
                  },
                  required: ["title", "description", "url"]
                }
              }
            },
            required: ["id", "name", "platform", "description", "trendScore", "reason", "source", "examples"]
          }
        }
      }
    });

    console.log("Gemini Response received:", response.text);
    const text = response.text || '[]';
    const cleanedText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to fetch or parse trending niches", e);
    return [];
  }
}

export async function getPersonalizedNiches(mediaData: any[], customApiKey?: string): Promise<TrendingNiche[]> {
  const aiInstance = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : defaultAi;
  if (!aiInstance) {
    console.error("AI instance not initialized. Check your API key.");
    return [];
  }
  const mediaDescriptions = mediaData.slice(0, 10).map(m => m.caption || 'No caption').join(' | ');
  
  const prompt = `
    Analyze the following content DNA from a user's recent Instagram posts:
    "${mediaDescriptions}"
    
    Identify 3 strategic "Pivot Niches" that align with their existing style but leverage current viral trends on Instagram Reels and YouTube Shorts.
    
    Use Google Search to find real-world validation for these recommendations.
    For each niche, provide:
    - A professional niche title.
    - Platform recommendation (instagram, youtube, or both).
    - Tactical description of the content execution.
    - Trend Score (0-100) reflecting current market demand.
    - Synergy Analysis: Why this fits their specific content DNA and why it's trending.
    - Data source.
    - 2 real-world examples with verified URLs.
  `;

  try {
    console.log(`Fetching personalized niches with search grounding ${customApiKey ? '(using custom API)' : ''}...`);
    const response = await aiInstance.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique slug for the niche" },
              name: { type: Type.STRING, description: "The name of the niche" },
              platform: { type: Type.STRING, enum: ["instagram", "youtube", "both"] },
              description: { type: Type.STRING, description: "Short description of the content" },
              trendScore: { type: Type.NUMBER, description: "Trend score out of 100" },
              reason: { type: Type.STRING, description: "Why it's trending and fits their profile" },
              source: { type: Type.STRING, description: "The API or data source used" },
              examples: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    url: { type: Type.STRING, description: "A valid, working URL to a real video or search result" }
                  },
                  required: ["title", "description", "url"]
                }
              }
            },
            required: ["id", "name", "platform", "description", "trendScore", "reason", "source", "examples"]
          }
        }
      }
    });

    console.log("Gemini Personalized Response received:", response.text);
    const text = response.text || '[]';
    const cleanedText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to fetch or parse personalized niches", e);
    return [];
  }
}

export async function generateViralScript(niche: string, platform: string, customApiKey?: string): Promise<ViralScript> {
  const aiInstance = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : defaultAi;
  if (!aiInstance) {
    console.error("AI instance not initialized. Check your API key.");
    throw new Error("AI instance not initialized. Check your API key.");
  }
  const prompt = `
    Generate a high-conversion, viral-engineered video blueprint for the "${niche}" niche on ${platform}.
    
    Your output must include:
    1. A "Viral Script" with a high-retention hook (first 3 seconds), a value-packed body, and a strong CTA.
    2. A "Hashtag Strategy" (10-15 tags) optimized for the current algorithm.
    3. A "Production Toolkit" of 5-8 tools (mix of free/paid) with verified official URLs.
    4. "Watermark Mastery": Professional tips on achieving a clean, premium look without visible tool branding.
    5. A "Cinematic Image Prompt": A highly detailed prompt for AI image generators (Midjourney/DALL-E 3) to create a thumbnail that stops the scroll. Focus on lighting, composition, and emotional impact.
  `;

  try {
    console.log(`Generating viral script for ${niche} on ${platform} with search grounding ${customApiKey ? '(using custom API)' : ''}...`);
    const response = await aiInstance.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            niche: { type: Type.STRING },
            platform: { type: Type.STRING },
            content: { type: Type.STRING, description: "The full script including visual cues and spoken text." },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            tools: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['free', 'paid'] },
                  url: { type: Type.STRING, description: "The verified official website URL for the tool" },
                  description: { type: Type.STRING }
                },
                required: ["name", "type", "url", "description"]
              } 
            },
            watermarkTips: { type: Type.STRING, description: "Detailed tips on removing watermarks from the suggested tools." },
            imagePrompt: { type: Type.STRING, description: "A refined, high-quality image generation prompt for AI image tools." }
          },
          required: ["niche", "platform", "content", "tags", "tools", "watermarkTips", "imagePrompt"]
        }
      }
    });

    console.log("Gemini Script Response received:", response.text);
    const text = response.text || '{}';
    const cleanedText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to generate or parse viral script", e);
    throw new Error("Failed to generate script");
  }
}
