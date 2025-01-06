import StorageManager from './StorageManager';
import context from '../context/context';
import { PRODUCTIVITY_SCORE, RULES } from './rules';

const API_KEY = process.env.OPENAI_API_KEY;

export const summarizeDay = async () => {
    if (!API_KEY) throw new Error("OpenAI API key not found")

    const { shortTermMemory, longTermMemory, goals, userName } = await StorageManager.getMultiple([
        StorageManager.STORAGE_KEYS.SHORT_TERM_MEMORY,
        StorageManager.STORAGE_KEYS.LONG_TERM_MEMORY,
        StorageManager.STORAGE_KEYS.GOALS,
        StorageManager.STORAGE_KEYS.USER_NAME
    ])

    const productivityMetrics = PRODUCTIVITY_SCORE.calculate(shortTermMemory)
    const shortTermSummary = formatData(shortTermMemory || [], "short-term")
    const longTermSummary = formatData(longTermMemory || [], "context")
    const goalsSummary = formatGoals(goals || [], "goals")

    const prompt = createPrompt(userName, shortTermSummary, longTermSummary, goalsSummary, productivityMetrics)

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300
        })
    })

    if (!response.ok) throw new Error(`API request failed: ${response.status}`)
    
    const data = await response.json()
    return data.choices?.[0]?.message?.content
}

const createPrompt = (userName, shortTermSummary, longTermSummary, goalsSummary, productivityMetrics) => {
    const systemContext = `Hey! I'm your productivity friend who gets your background as a design engineer at UCI studying CS and Neuroscience. I know you're all about that frontier tech space and aiming for Forbes 30u30.

        Your vibe and my response style:
        ${context.examples.slice(3, 6).join('\n')}

        I'll use casual phrases like ${context.casualPhrases.slice(0, 4).join(', ')} and keep it real - no corporate speak.

        Quick context on your productivity:
        Score: ${productivityMetrics.score.toFixed(2)} - ${productivityMetrics.level}
        ${productivityMetrics.label}

        I'll analyze your browsing patterns through the lens of your interests in ${context.writingStyle.focus} and your connection to ${context.additionalContext[3]}.`

    const analysisPrompt = `
        Let's break down your browsing patterns in these sections (keep it casual but strategic):

        [SHORT_TERM]
        Here's what I'm seeing in your tabs. I will identify the main pattern of topics you explored based on the url:
        ${shortTermSummary}

        Follow this flow but make it conversational:
        ${RULES.shortTerm.structure.join('\n')}

        [LONG_TERM]
        Looking at your patterns over time:
        ${longTermSummary}

        Tell me how these patterns connect to your journey of mastery and tech goals.

        [GOAL_ALIGNMENT]
        Your goals and current focus:
        ${goalsSummary}

        Break it down following this structure (but keep it friend-to-friend). Compare it to previous history of activity and how the user is changing over time based on ${longTermSummary}:
        ${RULES.goalAlignment.structure.join('\n')}

        [ONE_LINER]
        Give one sentence responding to a friend's question about how my day went and what I did. Give 1 specific example of a url I spent significant time on.

        Remember: Keep each section clearly marked with [SECTION_NAME], use 2-3 sentences per section, and make it sound like we're having a casual convo about your progress. Reference specific URLs and what they mean for your goals, but don't just list domains.

        Style notes:
        - Talk like we're friends chatting about progress
        - Use phrases from ${context.casualPhrases.slice(0, 3).join(', ')}
        - Keep it strategic but not formal
        - Channel that ${context.writingStyle.personality} energy
        - Make specific references to frontier tech and your CS/Neuroscience interests when relevant`

    return `${systemContext}\n\n${analysisPrompt}`
}

// helper function to retrieve data from chrome storage
const formatData = (data, type) => {
    if (!Array.isArray(data) || data.length === 0) return `No ${type} data available`

    // Group by domain for better summary
    const domainGroups = data.reduce((acc, entry) => {
        if (!entry?.url) return acc
        
        try {
            const url = new URL(entry.url)
            const domain = url.hostname
            
            if (domain.startsWith('chrome://') || !domain) return acc
            
            // Create or update domain entry
            if (!acc[domain]) {
                acc[domain] = {
                    domain,
                    visits: [],
                    count: 0,
                    totalDuration: 0
                }
            }
            
            acc[domain].visits.push(entry)
            acc[domain].count++
            acc[domain].totalDuration += entry.duration || 0
            
        } catch (e) {
            console.warn('Invalid URL in formatData:', entry.url)
        }
        return acc
    }, {})

    const topDomains = Object.values(domainGroups)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

    return topDomains.map(domain => 
        `- ${domain.domain}: ${domain.count} visits (${Math.round(domain.totalDuration / 60)} minutes)`
    ).join('\n')
}

const formatGoals = (goals) => {
    if (!goals?.shortTerm?.length && !goals?.longTerm?.length) return "No goals available"
    
    return `Short-term goals:\n${goals.shortTerm?.map(goal => `- ${goal}`).join("\n") || "None"}\n\n` +
           `Long-term goals:\n${goals.longTerm?.map(goal => `- ${goal}`).join("\n") || "None"}`
}
