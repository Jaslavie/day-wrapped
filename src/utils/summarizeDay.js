import { OPENAI_API_KEY } from '../env';

export const summarizeDay = async (websites, topics) => {
    const { shortTermMemory, longTermMemory, goals } = await chrome.storage.local.get([
        "shortTermMemory", 
        "longTermMemory", 
        "goals"
    ]);

    const shortTermSummary = formatData(shortTermMemory || [], "short-term");
    const longTermSummary = formatData(longTermMemory || [], "context");
    const goalsSummary = formatGoals(goals || [], "goals");

    const prompt = `Summarize the user's day based on the websites and topics 
    the user has visited in the last 24 hours summarized inside of ${shortTermSummary}. 
    Compare the user's day with their past browsing history based on the 
    following context: ${longTermSummary}. 
    Compare the user's day with their goals based on the following goals: ${goalsSummary}. 
    Break up the summary instead these 3 subsections to make it as concise, clear, and easy 
    to understand as possible.`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
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

// helper function to format goals
const formatGoals = (goals) => {
    if (goals.length === 0) return "No goals available";

    // format goals for the LLM in the following format: - short-term goal or - long-term goal
    return `Short-term goals:\n${goals.shortTerm.map(goal => `- ${goal}`).join("\n")}\n\n` +
    `Long-term goals:\n${goals.longTerm.map(goal => `- ${goal}`).join("\n")}`;
}