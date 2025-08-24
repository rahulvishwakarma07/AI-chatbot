const axios = require('axios');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function callGeminiAPI(prompt) {
    try {
        const response = await axios.post(
            `${GEMINI_API_URL}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    "X-goog-api-key": GEMINI_API_KEY
                }
            }
        );

        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Gemini API error:', error.response?.data || error.message);
        throw new Error('Failed to call Gemini API');
    }
}

async function classifyQuery(message) {
    const classificationPrompt = `
 You are a financial domain assistant.
  - If NOT finance, respond: {"domain":"non-finance"}
  - If finance:
     * If it's general finance concept, respond: {"domain":"finance","type":"general","intent":"definition"}
     * If it's user data query (like "what is my aum?", "show my transactions"), respond: {"domain":"finance","type":"data","intent":"aum"|"transactions"|"clients"}
  Reply in valid JSON only.
  `;

    try {
        const result = await callGeminiAPI(classificationPrompt);
        return JSON.parse(result.trim());
    } catch (error) {
        console.error('Classification error:', error);
        // Fallback classification
        return {
            type: message.toLowerCase().includes('data') ||
                message.toLowerCase().includes('search') ||
                message.toLowerCase().includes('find') ? 'data' : 'general',
            intent: null,
            confidence: 0.5
        };
    }
}

async function generateResponse(message, data = null, type = 'general') {
    let prompt;

    if (type === 'data' && data) {
        
        prompt = `You are a financial assistant helping the user understand their data.
    
                User query: "${message}"
                            
                Database results: ${JSON.stringify(data)}
                    
                Instructions:
                1. Interpret the database results in the context of the user's query.
                2. Present the information in clear financial terms (balance, transactions, investments, AUM, etc.).
                3. Use a professional yet friendly tone, like a financial advisor would.
                4. Keep it concise, but if important insights are in the data, highlight them.
                5. If the data doesn’t fully answer the query, say that politely and guide the user on what else they can ask.
                    `;
    } else {
        
        prompt = `You are an AI-powered financial assistant. 

                User query: "${message}"

                Instructions:
                1. Answer in the context of personal finance, wealth management, and investments.
                2. Be conversational, but also precise and insightful.
                3. If it's a definition question (e.g., "What is AUM?"), explain in simple financial terms with a short example.
                4. If it's an advice-style query, provide general financial guidance (but clarify that it's not personalized financial advice).
                5. Avoid vague answers—always stay finance-focused.
                    `;
    }

    try {
        return await callGeminiAPI(prompt);
    } catch (error) {
        return type === 'data'
            ? "The data was retrieved, but there was an issue generating a financial response."
            : "Sorry, I’m unable to generate a financial response at the moment. Please try again later.";
    }
}


module.exports = { classifyQuery, generateResponse };
