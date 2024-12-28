import { OPENAI_API_KEY } from '../config';

export const summarizeDay = async (websites, topics) => {
    const { shortTermMemory } = await chrome.storage.local.get("shortTermMemory");
    const { longTermMemory } = await chrome.storage.local.get("longTermMemory");

    const shortTermSummary = formatData(shortTermMemory || [], "short-term");
    const longTermSummary = formatData(longTermMemory || [], "context");

    const prompt = `Summarize the user's day based on the websites and topics 
    the user has visited in the last 24 hours summarized inside of ${shortTermSummary}. 
    Compare the user's day with their goals and their past browsing history based on the 
    following context: ${longTermSummary}.`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                max_tokens: 300
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error("OpenAI API Error:", error);
        throw new Error("Failed to generate summary. Please check your API key and try again.");
    }
};

// helper function to retrieve data from chrome storage
const formatData = (data, type) => {
    if (data.length === 0) return `No ${type} data available`;

    // format data for the LLM in the following format: - url (timestamp) or - domain: count visits
    return data
        .map((entry) => (entry.url ? `- ${entry.url} (${entry.time})` : `- ${entry.domain}: ${entry.count} visits`))
        .join("\n"); // join the formatted data with a newline character
}