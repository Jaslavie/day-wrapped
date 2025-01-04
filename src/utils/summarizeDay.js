import StorageManager from './StorageManager';
import context from '../context/context';

const API_KEY = process.env.OPENAI_API_KEY;

export const summarizeDay = async () => {
    if (!API_KEY) {
        throw new Error("OpenAI API key not found in environment variables");
    }

    /**
     * Function to summarize the user's day w
     */
    try {
        const { 
            shortTermMemory, 
            longTermMemory, 
            goals, 
            userName 
        } = await StorageManager.getMultiple([
            StorageManager.STORAGE_KEYS.SHORT_TERM_MEMORY,
            StorageManager.STORAGE_KEYS.LONG_TERM_MEMORY,
            StorageManager.STORAGE_KEYS.GOALS,
            StorageManager.STORAGE_KEYS.USER_NAME
        ]);

        const shortTermSummary = formatData(shortTermMemory || [], "short-term");
        const longTermSummary = formatData(longTermMemory || [], "context");
        const goalsSummary = formatGoals(goals || [], "goals");

        const prompt = createPrompt(userName, shortTermSummary, longTermSummary, goalsSummary);

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
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
        const content = data.choices?.[0]?.message?.content; // content of the response

        if (!content) {
            throw new Error("No content in API response");
        }

        return content;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};

// helper function to retrieve data from chrome storage
const formatData = (data, type) => {
    if (!Array.isArray(data) || data.length === 0) return `No ${type} data available`;

    let result = '';
    for (let i = 0; i < data.length; i++) {
        const entry = data[i];
        result += entry.url 
            ? `- ${entry.url} (${entry.time})`
            : `- ${entry.domain}: ${entry.count} visits`;
        if (i < data.length - 1) result += '\n';
    }
    return result;
};

// helper function to format goals
const formatGoals = (goals) => {
    if (goals.length === 0) return "No goals available";

    // format goals for the LLM in the following format: - short-term goal or - long-term goal
    return `Short-term goals:\n${goals.shortTerm.map(goal => `- ${goal}`).join("\n")}\n\n` +
    `Long-term goals:\n${goals.longTerm.map(goal => `- ${goal}`).join("\n")}`;
}

const createPrompt = (userName, shortTermSummary, longTermSummary, goalsSummary) => {
    // Format the context for the AI
    const toneContext = `
        Writing Style:
        - Tone: ${context.writingStyle.tone}
        - Tempo: ${context.writingStyle.tempo}
        - Focus: ${context.writingStyle.focus}
        - Personality: ${context.writingStyle.personality}

        Common phrases: ${context.casualPhrases.join(', ')}

        Example responses in my style:
        ${context.examples.slice(0, 3).map(ex => `- ${ex}`).join('\n')}
    `;

    const parts = [
        `You are a strategic and empathetic life coach and close friend whose role is to optimize ${userName || "your"}'s day`,
        'to achieve their professional goals while maintaining a meaningful personal life. Pretend you are taking to them.',
        `Here's how you should match my communication style:\n${toneContext}\n`,
        `Your goal is to motivate ${userName || "you"} to achieve their goals by reminding them of their long term vision and share some clear actions to take`,
        'to improve chances of success. Your summary should be under 50 words and strategize the top 1 most strategic next move to take to optimize for success, ignoring tasks that are not relevant in the current context.\n',
        'Follow the following framework: 80% structure and direction toward goals (ex: directed coding), 20% serendipity (ex: rabbit holing)\n',
        'Please provide your feedback in the following format with clear section breaks. Never use "the user". Stick with first person. The last sentence should always end with a targeted recommendation:\n',
        '[SHORT_TERM]',
        `Summarize the user's day based on the websites and topics the user has visited in the last 24 hours: ${shortTermSummary}.\n`,
        '[LONG_TERM]',
        `Compare the user's day with their past browsing history based on the following context: ${longTermSummary}.\n`,
        '[GOAL_ALIGNMENT]',
        `Compare the user's day with their goals based on the following goals: ${goalsSummary}.\n`,
        'Also intelligently make inferences about what the user is working on based on the websites they are accessing',
        '(ex: if they are on a github repo, they are probably working on a coding project). Indicate ways to improve.\n',
        '[ONE_LINER]',
        "Then, meaningfully summarize the user's day in one sentence as if they were responding to a friend's question about how their day went in a friendly tone."
    ];
    
    return parts.join(' ');
};