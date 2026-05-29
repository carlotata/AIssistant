export const CHAT_GREETINGS = [
    "What's on your mind today?",
    "Ready to explore something new?",
    "What are we curious about?",
    "Let's make some progress.",
    "Anything interesting to dive into?",
    "Ready for a productive study session?",
    "What shall we learn about today?"
];

export const DASHBOARD_GREETINGS = [
    "Welcome back!",
    "Great to see you again!",
    "Ready to pick up where you left off?",
    "Let's make today count!",
    "Good to have you back."
];

export const PROGRESS_MESSAGES = {
    high: [
        "You're on a roll!",
        "Incredible momentum!",
        "Keep up the fantastic work!"
    ],
    low: [
        "Let's keep the momentum going!",
        "Every lesson brings you closer to your goal.",
        "Ready to dive back in?"
    ],
    none: [
        "Ready to start your first lesson?",
        "A blank slate is a great place to begin.",
        "Let's get started!"
    ]
};

export function getGreeting(userName?: string, type: 'dashboard' | 'chat' = 'dashboard') {
    if (type === 'dashboard') {
        const randomGreeting = DASHBOARD_GREETINGS[Math.floor(Math.random() * DASHBOARD_GREETINGS.length)];
        return userName ? `${randomGreeting} ${userName}!` : randomGreeting;
    }
    
    const randomGreeting = CHAT_GREETINGS[Math.floor(Math.random() * CHAT_GREETINGS.length)];
    if (!userName) return randomGreeting;
    
    return `Hello, ${userName}! ${randomGreeting}`;
}

export function getProgressMessage(count: number) {
    if (count === 0) {
        return PROGRESS_MESSAGES.none[Math.floor(Math.random() * PROGRESS_MESSAGES.none.length)];
    }
    if (count > 3) {
        return PROGRESS_MESSAGES.high[Math.floor(Math.random() * PROGRESS_MESSAGES.high.length)];
    }
    return PROGRESS_MESSAGES.low[Math.floor(Math.random() * PROGRESS_MESSAGES.low.length)];
}
