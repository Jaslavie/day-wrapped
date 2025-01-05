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

    // Group by domain for better summary
    const domainGroups = data.reduce((acc, entry) => {
        if (!entry?.url) return acc;
        
        try {
            const url = new URL(entry.url);
            const domain = url.hostname;
            
            // Skip chrome:// and empty URLs
            if (domain.startsWith('chrome://') || !domain) return acc;
            
            // Create or update domain entry
            if (!acc[domain]) {
                acc[domain] = {
                    domain,
                    visits: [],
                    count: 0,
                    totalDuration: 0
                };
            }
            
            acc[domain].visits.push(entry);
            acc[domain].count++;
            acc[domain].totalDuration += entry.duration || 0;
            
        } catch (e) {
            console.warn('Invalid URL in formatData:', entry.url);
        }
        return acc;
    }, {});

    // Get top domains by visit count
    const topDomains = Object.values(domainGroups)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return topDomains.map(domain => 
        `- ${domain.domain}: ${domain.count} visits (${Math.round(domain.totalDuration / 60)} minutes)`
    ).join('\n');
};

// helper function to format goals
const formatGoals = (goals) => {
    if (goals.length === 0) return "No goals available";

    // format goals for the LLM in the following format: - short-term goal or - long-term goal
    return `Short-term goals:\n${goals.shortTerm.map(goal => `- ${goal}`).join("\n")}\n\n` +
    `Long-term goals:\n${goals.longTerm.map(goal => `- ${goal}`).join("\n")}`;
}

const createPrompt = (userName, shortTermSummary, longTermSummary, goalsSummary) => {
    const toneContext = `
        Writing Style:
        - ${context.writingStyle.tone}
        - ${context.writingStyle.tempo}
        - Use casual phrases like: ${context.casualPhrases.join(', ')}
        - ${context.writingStyle.observations.conciseness}
        - ${context.writingStyle.observations.prioritization}
        
        Example responses to match in writing style:
        ${context.examples.slice(0, 5).join('\n')}

        Use additional context:
        ${context.additionalContext.join('\n')}
    `;

    const parts = [
        `I'm your strategic advisor and friend focused on ${context.writingStyle.focus}. I will analyze your browsing patterns deeply and evaluate your progress based on your goals and background about you in a casual and conversational tone.`,
        `Here's my communication style:\n${toneContext}\n`,
        `Response Structure: Break down the top 1-2 main patterns of browsing behavior in 2-3 sentences. ${context.writingStyle.observations.strategicFocus} Use the following format: [SHORT_TERM] [LONG_TERM] [GOAL_ALIGNMENT] [ONE_LINER] each in their own unique sections. Use first-person pronouns. In your response, pull out specific examples of the user's browsing history. Avoid generic responses. Each summary should be limited to 100 characters max and be in paragraph form only.`,
        `Rules: A semicolon is not allowed. Each sentence should be a complete sentence and thought. Sentences should flow logically into each other and include transition phrases. Sentences shall not pass 100 characters.`,
        '[SHORT_TERM]',
        `Analyze the browsing patterns from the last 24 hours: ${shortTermSummary}. End with a sentence suggesting a strategic and targeted next step based on context of my goals.\n`,
        '[LONG_TERM]',
        `Compare with historical patterns: ${longTermSummary}.\n`,
        '[GOAL_ALIGNMENT]',
        `Evaluate progress on goals: ${goalsSummary}. The last sentence provides targeted recommendations for improvement.\n`,
        'Make strategic inferences about current projects from browsing patterns. Return 1-2 example urls from the browsing history to illustrate the patterns.',
        '[ONE_LINER]',
        "Give a friend-to-friend summary of the day's progress and momentum in one sentence."
    ];
    
    return parts.join(' ');
};