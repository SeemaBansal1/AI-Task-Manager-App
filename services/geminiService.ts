import { GoogleGenAI, Type } from "@google/genai";
import { Task, AiMotivationResponse } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getMorningMotivation = async (userName: string, upcomingTasks: Task[]): Promise<AiMotivationResponse> => {
  if (!apiKey) {
    return {
      message: "Ready to conquer the day! Add your API key for personalized AI coaching.",
      quote: "Believe you can and you're halfway there."
    };
  }

  const taskSummary = upcomingTasks.map(t => `- ${t.title} (${t.priority}, Due: ${t.deadline})`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        The user's name is ${userName}.
        Here are their top tasks for today:
        ${taskSummary}
        
        Generate a short, high-energy, fun motivational message to help them start the day. 
        Also provide a short inspirational quote.
        Be friendly, like a supportive best friend ("Your Buddy").
        Mention one of their tasks specifically if it looks important.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            quote: { type: Type.STRING }
          },
          required: ["message", "quote"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AiMotivationResponse;
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      message: `Good morning ${userName}! Let's crush those goals today!`,
      quote: "Every day is a fresh start."
    };
  }
};

export const getSmartPrioritization = async (tasks: Task[]): Promise<string[]> => {
  if (!apiKey || tasks.length === 0) return tasks.map(t => t.id);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze these tasks and return their IDs in the order they should be done for maximum productivity.
        Consider deadlines and priority levels.
        Tasks: ${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, deadline: t.deadline, priority: t.priority })))}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
     
    if (response.text) {
        return JSON.parse(response.text) as string[];
    }
    return tasks.map(t => t.id);
  } catch (e) {
    console.error(e);
    return tasks.map(t => t.id);
  }
};