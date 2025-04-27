import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Calls the Gemini API with a given prompt and returns the response content
 * @param prompt The prompt to send to Gemini
 * @returns The content of Gemini's response as a string
 * @throws Error if the API key is missing or if the API call fails
 */
export async function callGemini(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Return the text content
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error(`Failed to get response from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
