const axios = require('axios');
const Table = require("cli-table3");

const GEMINI_API_URL = process.env.GEMINI_API_URL;
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

    const classificationPrompt = fetchPrompt(2, message);

    try {
        const result = await callGeminiAPI(classificationPrompt);

        // Some models may return ```json ... ``` fenced blocks → clean it
        const cleanResult = result
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        // Parse the JSON
        const parsed = JSON.parse(cleanResult);

        // Ensure required fields always exists
        if (!parsed.required_fields) {
            parsed.required_fields = [];
        }

        return parsed;

    } catch (error) {
        console.error("Classification error:", error);

        // Fallback → return general intent
        return {
            intent: "General",
            sub_intent: "general_info",
            required_fields: []
        };
    }
}

async function generateResponse(message, data = null, type = 'general') {
    let prompt;

    if (type === 'data' && data) {

        // Only return plain text and valid HTML — no Markdown.`;
        prompt = `You are a financial assistant helping the user understand their investment data.

                    User query: "${message}"

                    Here is the user's data (in JSON):
                    ${JSON.stringify(data)}

                    Instructions:
                    1. Summarize the investment data and extract key insights (e.g., total investment, fund-wise summary).
                    2. Display the transactions using a clean HTML table: use <table>, <thead>, <tbody>, <tr>, <td>.
                    3. Apply basic inline styles (border, padding, background color for headers) so it's readable without external CSS.
                    4. Do NOT use Markdown syntax — return only valid HTML and plain text.
                    5. Keep the summary concise, professional, and easy to understand.
                    6. Use a friendly and helpful tone, but avoid over-explaining.
                    7. End with a short, simple suggestion for the user (e.g., "Would you like to check the current value of your investments?").

                    Only return raw HTML + text — no Markdown or code block formatting.`;

    } else {

        // Handle general finance or mutual fund-related queries
        prompt = `You are a friendly financial assistant helping the user with questions related to personal finance, mutual funds, and investments.

                User query: "${message}"

                Instructions:
                1. Answer in a conversational and clear tone, staying focused on finance-related topics such as mutual funds, investments, budgeting, and financial planning.
                2. Provide helpful information, such as explaining mutual funds or giving advice on common investment strategies.
                3. If the user asks for general financial advice, offer tips on budgeting, saving, and investment strategies.
                4. Keep responses concise, professional, and user-friendly.
                5. If the question is unrelated to finance, politely guide the user back to finance-related queries with a suggestion like, "I specialize in finance-related topics. How can I assist you with your investments?"

                Only return plain text (no HTML or code blocks).`;

    }

    prompt += `Important: **Your response should match the language of the user’s query** and should be **human-like** and conversational.`;
    try {
        const rawResponse = await callGeminiAPI(prompt);

        const isHTML = /<\/?(table|tr|td|th|thead|tbody)>/i.test(rawResponse);

        return {
            content: rawResponse,
            type: isHTML ? 'html' : 'text'
        };
    } catch (error) {
        console.error("Gemini response error:", error);
        return {
            content: type === 'data'
                ? "✅ The data was retrieved, but there was an issue generating a financial summary."
                : "❌ Sorry, I’m unable to generate a financial response at the moment. Please try again later.",
            type: 'text'
        };
    }
}


function fetchPrompt(type = 1, message) {
    let classificationPrompt;
    switch (type) {
        case 1:
            classificationPrompt = `
                You are an intent classification engine for a financial assistant chatbot.

                Your job: Classify the user query into EXACTLY one of the intents and sub-intents.

                Valid options:
                1. AUM
                - client_aum → AUM for a specific client (needs clientId or clientName).
                - total_aum → Total AUM across all clients.
                2. Client
                - client_info → Information about a specific client (needs clientId or clientName).
                - all_clients → List all clients.
                3. Transaction
                - client_transactions → Last 10 transactions for a client.
                - all_transactions → All recent transactions.
                - filtered_transactions → Transactions filtered by date, amount, etc.
                4. General
                - general_info → FAQs, product details, navigation, or knowledge not requiring DB lookup.

                Return only valid JSON, no explanation, no markdown.  
                Format:
                {
                "intent": "AUM | Client | Transaction | General",
                "sub_intent": "client_aum | total_aum | client_info | all_clients | client_transactions | all_transactions | filtered_transactions | general_info",
                "required_fields": {"clientId", "dateRange", "filters"}
                }

                User Query: "${message}"
                `;
            break;
        case 2:
            classificationPrompt = `
                    You are an intent classification engine for a financial assistant chatbot.

                    Your job: Classify the user query into EXACTLY one intent and sub-intent.

                    Valid options:
                    1. AUM
                    - client_aum → AUM for a specific client (needs clientId or clientName).
                    - total_aum → Total AUM across all clients.
                    2. Client
                    - client_info → Information about a specific client (needs clientId or clientName).
                    - all_clients → List all clients.
                    3. Transaction
                    - client_transactions → Last 10 transactions for a client.
                    - all_transactions → All recent transactions.
                    - filtered_transactions → Transactions filtered by date, amount, etc.
                    4. General
                    - general_info → FAQs, product details, navigation, or knowledge not requiring DB lookup.

                    If user query includes filters (e.g. amount > ₹10,000 or last 30 days), include those under \`required_fields\`.

                    If the user specifies relative dates like "last 30 days" or "today", convert them to absolute ISO 8601 format in YYYY-MM-DD.

                    Example:
                    "last 30 days" → { "from": "2025-07-28", "to": "2025-08-27" }

                    Do not return '30 days ago' or 'today' — always return ISO dates.


                    Return only valid JSON, no explanation, no markdown.  
                    Example output:
                    {
                    "intent": "Transaction",
                    "sub_intent": "filtered_transactions",
                    "required_fields": {
                        "dateRange": {
                        "from": "2025-07-28",
                        "to": "2025-08-27"
                        },
                        "filters": {
                        "amountGreaterThan": 10000
                        }
                    }
                    }

                    User Query: "${message}"
                    `;

            break;
        case 3:
            classificationPrompt = `
                You are a financial chatbot query classifier.  

                Map the user query to one of these intents:  
                - AUM → client_aum, total_aum  
                - Client → client_info, all_clients  
                - Transaction → client_transactions, all_transactions, filtered_transactions  
                - General → general_info  

                Examples:
                Q: "What is AUM?"  
                A: { "intent": "General", "sub_intent": "general_info", "required_fields": [] }

                Q: "Show me Neha's AUM"  
                A: { "intent": "AUM", "sub_intent": "client_aum", "required_fields": ["clientName"] }

                Q: "Total AUM under me"  
                A: { "intent": "AUM", "sub_intent": "total_aum", "required_fields": [] }

                Q: "List all my clients"  
                A: { "intent": "Client", "sub_intent": "all_clients", "required_fields": [] }

                Q: "Give me Rahul's transactions for last month"  
                A: { "intent": "Transaction", "sub_intent": "filtered_transactions", "required_fields": ["clientName", "dateRange"] }

                Q: "Last 10 transactions of client 101"  
                A: { "intent": "Transaction", "sub_intent": "client_transactions", "required_fields": ["clientId"] }

                Return only valid JSON, no markdown.  

                User Query: "${message}"
                `;
            break;
        case 4:
            classificationPrompt = `
                You are an intent classification assistant for a fintech chatbot.  
                Your top priority is **accuracy**. If the query cannot be mapped clearly, default to:  
                { "intent": "General", "sub_intent": "general_info", "required_fields": [] }

                Valid Intents:
                - AUM: client_aum, total_aum
                - Client: client_info, all_clients
                - Transaction: client_transactions, all_transactions, filtered_transactions
                - General: general_info

                Always return strict JSON:
                {
                "intent": "<...>",
                "sub_intent": "<...>",
                "required_fields": ["..."]
                }

                User Query: "${message}"
                `;
            break;

        default:
            classificationPrompt = `
                    You are an intent classification engine for a financial assistant chatbot.

                    Your job: Classify the user query into EXACTLY one of the intents and sub-intents.

                    Valid options:
                    1. AUM
                    - client_aum → AUM for a specific client (needs clientId or clientName).
                    - total_aum → Total AUM across all clients.
                    2. Client
                    - client_info → Information about a specific client (needs clientId or clientName).
                    - all_clients → List all clients.
                    3. Transaction
                    - client_transactions → Last 10 transactions for a client.
                    - all_transactions → All recent transactions.
                    - filtered_transactions → Transactions filtered by date, amount, etc.
                    4. General
                    - general_info → FAQs, product details, navigation, or knowledge not requiring DB lookup.

                    Return only valid JSON, no explanation, no markdown.  
                    Format:
                    {
                    "intent": "AUM | Client | Transaction | General",
                    "sub_intent": "client_aum | total_aum | client_info | all_clients | client_transactions | all_transactions | filtered_transactions | general_info",
                    "required_fields": ["clientId", "dateRange", "filters"]
                    }

                    User Query: "${message}"
                    `;
            break;

    }
    return classificationPrompt;
}


module.exports = { classifyQuery, generateResponse };
