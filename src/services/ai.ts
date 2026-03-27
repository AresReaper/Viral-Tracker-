import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface TrendingNiche {
  id: string;
  name: string;
  platform: 'instagram' | 'youtube' | 'both';
  description: string;
  trendScore: number;
  reason: string;
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
  tools: string[];
  watermarkTips: string;
}

export async function getTrendingNiches(): Promise<TrendingNiche[]> {
  const prompt = `
    Analyze current social media trends and identify the top 6 viral niches right now across Instagram Reels and YouTube Shorts.
    For each niche, provide:
    - A catchy name
    - The platform it's most viral on (instagram, youtube, or both)
    - A short description of what the content looks like
    - A trend score out of 100
    - The reason why it's trending right now
    - 2 examples of successful content types or specific viral video ideas within this niche, including a descriptive title, a brief explanation of the video, and a hypothetical or real example URL (e.g., https://instagram.com/reels/... or https://youtube.com/shorts/...)
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
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
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ["title", "description", "url"]
              }
            }
          },
          required: ["id", "name", "platform", "description", "trendScore", "reason", "examples"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse trending niches", e);
    return [];
  }
}

export async function getPersonalizedNiches(mediaData: any[]): Promise<TrendingNiche[]> {
  const mediaDescriptions = mediaData.slice(0, 10).map(m => m.caption || 'No caption').join(' | ');
  
  const prompt = `
    Analyze the following recent Instagram post captions from a user:
    "${mediaDescriptions}"
    
    Based on their current content style, identify 3 highly personalized, trending niches they should pivot to or double down on for Instagram Reels and YouTube Shorts.
    For each niche, provide:
    - A catchy name
    - The platform it's most viral on (instagram, youtube, or both)
    - A short description of what the content looks like
    - A trend score out of 100
    - The reason why it's trending right now and why it fits their profile
    - 2 examples of successful content types or specific viral video ideas within this niche, including a descriptive title, a brief explanation of the video, and a hypothetical or real example URL.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
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
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ["title", "description", "url"]
              }
            }
          },
          required: ["id", "name", "platform", "description", "trendScore", "reason", "examples"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse personalized niches", e);
    return [];
  }
}

export async function generateViralScript(niche: string, platform: string): Promise<ViralScript> {
  const prompt = `
    Create a highly engaging, viral-optimized script for a short-form video (Reel/Short) in the "${niche}" niche for ${platform}.
    
    Include:
    1. The exact script (hook, body, call to action). Make it punchy and fast-paced.
    2. A list of 10-15 highly effective tags/hashtags to make it go viral.
    3. A list of 3-5 free tools or sources where the user can create or edit this video (e.g., CapCut, Canva, specific free stock footage sites).
    4. If any of these tools have watermarks, provide exact instructions on how to remove them for free or avoid them.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          niche: { type: Type.STRING },
          platform: { type: Type.STRING },
          content: { type: Type.STRING, description: "The full script including visual cues and spoken text." },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          tools: { type: Type.ARRAY, items: { type: Type.STRING } },
          watermarkTips: { type: Type.STRING, description: "Detailed tips on removing watermarks from the suggested tools." }
        },
        required: ["niche", "platform", "content", "tags", "tools", "watermarkTips"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse viral script", e);
    throw new Error("Failed to generate script");
  }
}
