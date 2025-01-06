const DOMAIN_CATEGORIES = {
    TECHNICAL: {
        domains: ['github.com', 'gitlab.com', 'stackoverflow.com'],
        weight: 1.0,
        description: 'Coding and development'
    },
    LEARNING: {
        domains: ['coursera.org', 'substack.com', 'medium.com'],
        weight: 0.9,
        description: 'Learning and rabitholing'
    },
    STUDY: {
        domains: ['canvas.uci.edu', 'docs.google.com'],
        weight: 0.7,
        description: 'School and university related'
    },
    ADMIN: {
        domains: ['gmail.com', 'calendar.google.com', 'slack.com', 'schej.it'],
        weight: 0.4,
        description: 'Administrative work like emailing, scheduling, and slack'
    },
    ENTERTAINMENT: {
        domains: ['youtube.com', 'reddit.com'],
        weight: 0.1,
        description: 'Entertainment and media'
    },
    NETWORKING: {
        domains: ['twitter.com', 'instagram.com', 'linkedin.com'],
        weight: 0.5,
        description: 'Social networking'
    }
}

const ACTIVITY_THRESHOLD = {
    VERY_HIGH: {
        visits: 50,
        duration: 240, // 4 hours
        description: 'Extremely active usage'
    },
    HIGH: {
        visits: 30,
        duration: 180, // 3 hours
        description: 'Above average usage'
    },
    MODERATE: {
        visits: 15,
        duration: 90, // 1.5 hours
        description: 'Normal usage'
    },
    LOW: {
        visits: 5,
        duration: 5, // 5 minutes
        description: 'Light usage'
    }
}

const PRODUCTIVITY_SCORE = {
    RANGES: {
        EXCEPTIONAL: { min: 0.8, max: 1.0, label: 'Exceptional focus on high-value activities'},
        PRODUCTIVE: { min: 0.6, max: 0.79, label: 'Strong productivity with good balance' },
        MODERATE: { min: 0.4, max: 0.59, label: 'Balanced mix of activities' },
        LOW: { min: 0.2, max: 0.39, label: 'Limited focus on productive tasks' },
        POOR: { min: 0, max: 0.19, label: 'Primarily low-impact activities' }
    },

    // calculate the productivity score based on the number of visits
    calculate: (visits) => {
        // extract domain and score
        const domainScores = visits.reduce((acc, visit) => {
            /**
             * acc is the total score and number of visits
             * visit is the current visit
             */
            try {
                const domain = new URL(visit.url).hostname;
                const category = Object.values(DOMAIN_CATEGORIES)
                    .find(cat => cat.domains.includes(domain))
                
                if (category) {
                    acc.weightedTime += (visit.duration || 0) * category.weight; // the importance of the visit
                    acc.totalTime += visit.duration || 0; // total time spent on the visit
                }
            } catch (e) {}

            return acc;
        }, { weightedTime: 0, totalTime: 0 });

        // calculate score
        const score = domainScores.totalTime >0
            ? domainScores.weightedTime / domainScores.totalTime
            :0
        
        // determine the range
        const range = Object.entries(PRODUCTIVITY_SCORE.RANGES)
            .find(([_, range]) => score >= range.min && score <= range.max);
        
        // return the score and range
        return {
            score,
            level: range?.[0] || 'LOW',
            label: range?.[1]?.label || PRODUCTIVITY_SCORE.RANGES.POOR.label
        }
    }
}

const RULES = {
    general: [
        "A semicolon is not allowed.",
        "Each sentence should be a complete sentence and thought.",
        "Sentences should flow logically into each other and include transition phrases.",
        "Sentences shall not pass 100 characters.",
        "Reference all 24 hours and history of the user's browsing patterns in your response.",
        "Use second-person pronouns only.",
        "Never use the word 'user' in your response.",
        "The tone should be casual, conversational, and friendly. It shall not sound overly professional, formal, nor robotic.",
        "When introducing urls, be very specific and analyze the subdirectory of the url to determine the category of the domain.",
        "In your response, do not repeat the user's goals or information that is already obvious to them or they had given to you.",
        "The strategy should consider the impact of the user's browsing history on long term progress toward goals.",
        "Do not use generic phrases like 'tech exploration', 'learning', 'productivity tools'."
    ],
    shortTerm: {
        structure: [
            'First sentence should provide an overview of the main categories of websites visited that day (based on the url topics) and how they relate to browsing behavior over the day. Topics should be specific like multi-agent research, project management for a hackathon, etc.',
            'Second sentence provides the primary category of usage and the productivity average of the day. Give 2-3 examples of urls (NOT DOMAINS) that we visited that day to reflect the browsing behavior over the day.',
            'Third sentence provides a strategic and targeted next step based on context of my goals based on the SMART goals framework, indicating what the user can do to improve the next day.'
        ]
    }, 
    goalAlignment: {
        structure: [
            'First sentence provides a summary of the goals and how they align with long term AND short term goals, considering momentum over time.',
            'Second sentence provides a strategic and targeted next step based on context of my goals.',
            'Third sentence should indicate how the user should shift their focus to improve the next day, and provide some sample urls and topics that are optimal for the user to visit based on the browsing behavior over the day.'
        ]
    }
}

export {
    RULES,
    DOMAIN_CATEGORIES,
    ACTIVITY_THRESHOLD,
    PRODUCTIVITY_SCORE
}