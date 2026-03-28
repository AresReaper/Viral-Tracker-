import { GoogleGenAI, Type } from '@google/genai';
import Groq from 'groq-sdk';

const getAiInstance = (apiKey?: string) => {
  const key = apiKey || (process.env as any).GEMINI_API_KEY;
  if (!key) {
    console.warn('GEMINI_API_KEY is missing. AI features will not work.');
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
};

const defaultAi = getAiInstance();

const isGroqKey = (key: string) => key.startsWith('gsk_');

const getGroqApiKey = (customKey?: string) => {
  if (customKey && isGroqKey(customKey)) return customKey;
  const envKey = (process.env as any).GROQ_API_KEY;
  if (envKey && isGroqKey(envKey)) return envKey;
  return null;
};

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
  id?: string;
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

async function callGroq(apiKey: string, prompt: string, responseSchema?: any): Promise<string> {
  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  
  const messages: any[] = [
    {
      role: "system",
      content: responseSchema 
        ? "You are a world-class social media strategist. Return only valid JSON." 
        : "You are a world-class social media strategist."
    },
    {
      role: "user",
      content: prompt + (responseSchema ? `\n\nReturn the response in this exact JSON format: ${JSON.stringify(responseSchema)}` : "")
    }
  ];

  const completion = await groq.chat.completions.create({
    messages,
    model: "llama-3.3-70b-versatile",
    ...(responseSchema ? { response_format: { type: "json_object" } } : {})
  });
  
  return completion.choices[0]?.message?.content || "";
}

export async function getTrendingNiches(customApiKey?: string): Promise<TrendingNiche[]> {
  const prompt = `
    Act as a world-class social media strategist and trend analyst. 
    Analyze the current digital landscape across Instagram Reels and YouTube Shorts to identify the top 6 high-growth, viral-potential niches.
    
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

  const schema = {
    niches: [
      {
        id: "string",
        name: "string",
        platform: "instagram | youtube | both",
        description: "string",
        trendScore: "number",
        reason: "string",
        source: "string",
        examples: [
          { title: "string", description: "string", url: "string" }
        ]
      }
    ]
  };

  try {
    const groqKey = getGroqApiKey(customApiKey);
    if (groqKey) {
      console.log("Fetching trending niches using Groq...");
      try {
        const text = await callGroq(groqKey, prompt, schema);
        console.log("Groq Raw Response:", text);
        const parsed = JSON.parse(text);
        
        // Handle different response formats from Groq
        if (Array.isArray(parsed)) return parsed;
        if (parsed.niches && Array.isArray(parsed.niches)) return parsed.niches;
        if (parsed.data && Array.isArray(parsed.data)) return parsed.data;
        if (parsed.trendingNiches && Array.isArray(parsed.trendingNiches)) return parsed.trendingNiches;
        
        // If it's an object but not an array, try to find any array property
        const firstArray = Object.values(parsed).find(val => Array.isArray(val));
        if (firstArray) return firstArray as TrendingNiche[];
        
        return [];
      } catch (groqError) {
        console.warn("Groq API error, falling back to Gemini:", groqError);
      }
    }

    const aiInstance = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : defaultAi;
    if (!aiInstance) {
      console.error("AI instance not initialized. Check your API key.");
      return [];
    }

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
    const parsed = JSON.parse(cleanedText);
    if (!Array.isArray(parsed)) {
      console.error("Expected array from Gemini, got:", typeof parsed);
      return [];
    }
    return parsed;
  } catch (e) {
    console.error("Failed to fetch or parse trending niches", e);
    return [];
  }
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const groqKey = getGroqApiKey(apiKey);
    if (groqKey) {
      const groq = new Groq({ apiKey: groqKey, dangerouslyAllowBrowser: true });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: "hi" }],
        model: "llama-3.3-70b-versatile",
        max_tokens: 5
      });
      return !!completion.choices[0]?.message?.content;
    }

    const ai = new GoogleGenAI({ apiKey });
    // Simple fast check
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'hi',
      config: { maxOutputTokens: 5 }
    });
    return !!response.text;
  } catch (e) {
    console.error("API Key validation failed:", e);
    return false;
  }
}

export async function getPersonalizedNiches(mediaData: any[], customApiKey?: string): Promise<TrendingNiche[]> {
  const mediaDescriptions = mediaData.slice(0, 10).map(m => m.caption || 'No caption').join(' | ');
  
  const prompt = `
    Analyze the following content DNA from a user's recent Instagram posts:
    "${mediaDescriptions}"
    
    Identify 3 strategic "Pivot Niches" that align with their existing style but leverage current viral trends on Instagram Reels and YouTube Shorts.
    
    For each niche, provide:
    - A professional niche title.
    - Platform recommendation (instagram, youtube, or both).
    - Tactical description of the content execution.
    - Trend Score (0-100) reflecting current market demand.
    - Synergy Analysis: Why this fits their specific content DNA and why it's trending.
    - Data source.
    - 2 real-world examples with verified URLs.
  `;

  const schema = {
    niches: [
      {
        id: "string",
        name: "string",
        platform: "instagram | youtube | both",
        description: "string",
        trendScore: "number",
        reason: "string",
        source: "string",
        examples: [
          { title: "string", description: "string", url: "string" }
        ]
      }
    ]
  };

  try {
    const groqKey = getGroqApiKey(customApiKey);
    if (groqKey) {
      try {
        console.log("Fetching personalized niches using Groq...");
        const text = await callGroq(groqKey, prompt, schema);
        console.log("Groq Personalized Raw Response:", text);
        const parsed = JSON.parse(text);
        
        if (Array.isArray(parsed)) return parsed;
        if (parsed.niches && Array.isArray(parsed.niches)) return parsed.niches;
        if (parsed.data && Array.isArray(parsed.data)) return parsed.data;
        
        const firstArray = Object.values(parsed).find(val => Array.isArray(val));
        if (firstArray) return firstArray as TrendingNiche[];
        
        return [];
      } catch (groqError) {
        console.warn("Groq API error, falling back to Gemini:", groqError);
      }
    }

    const aiInstance = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : defaultAi;
    if (!aiInstance) {
      console.error("AI instance not initialized. Check your API key.");
      return [];
    }

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

export async function generateQuickPrompt(theme: string, customApiKey?: string): Promise<string> {
  const prompt = `Generate a high-quality, cinematic image generation prompt for an AI tool (like Midjourney or DALL-E 3) based on this theme: "${theme}". The prompt should be detailed, descriptive, and optimized for viral video thumbnails.`;

  try {
    const groqKey = getGroqApiKey(customApiKey);
    if (groqKey) {
      console.log("Generating quick prompt using Groq...");
      return await callGroq(groqKey, prompt);
    }

    const aiInstance = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : defaultAi;
    if (!aiInstance) {
      console.error("AI instance not initialized. Check your API key.");
      throw new Error("AI instance not initialized. Check your API key.");
    }

    const response = await aiInstance.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Failed to generate prompt";
  } catch (e) {
    console.error("Failed to generate quick prompt", e);
    throw new Error("Failed to generate prompt");
  }
}

export async function generateViralScript(niche: string, platform: string, customApiKey?: string): Promise<ViralScript> {
  const prompt = `
    Generate a high-conversion, viral-engineered video blueprint for the "${niche}" niche on ${platform}.
    
    Your output must include:
    1. A "Viral Script" with a high-retention hook (first 3 seconds), a value-packed body, and a strong CTA.
    2. A "Hashtag Strategy" (10-15 tags) optimized for the current algorithm.
    3. A "Production Toolkit" of 5-8 tools (mix of free/paid) with verified official URLs.
    4. "Watermark Mastery": Professional tips on achieving a clean, premium look without visible tool branding.
    5. A "Cinematic Image Prompt": A highly detailed prompt for AI image generators (Midjourney/DALL-E 3) to create a thumbnail that stops the scroll. Focus on lighting, composition, and emotional impact.
  `;

  const schema = {
    niche: "string",
    platform: "string",
    content: "string",
    tags: ["string"],
    tools: [
      { name: "string", type: "free | paid", url: "string", description: "string" }
    ],
    watermarkTips: "string",
    imagePrompt: "string"
  };

  try {
    const groqKey = getGroqApiKey(customApiKey);
    if (groqKey) {
      try {
        console.log("Generating viral script using Groq...");
        const text = await callGroq(groqKey, prompt, schema);
        return JSON.parse(text);
      } catch (e) {
        console.warn("Groq failed, falling back to Gemini", e);
      }
    }

    const aiInstance = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : defaultAi;
    if (!aiInstance) {
      console.error("AI instance not initialized. Check your API key.");
      throw new Error("AI instance not initialized. Check your API key.");
    }

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
