export const CHAT_GREETINGS = [
    "What's on your mind today?",
    "Ready to explore something new?",
    "What are we curious about?",
    "Let's make some progress.",
    "Anything interesting to dive into?",
    "Ready for a productive study session?",
    "What shall we learn about today?"
];

export function getGreeting(userName?: string, type: 'dashboard' | 'chat' = 'dashboard') {
    if (type === 'dashboard') {
        return userName ? `Welcome back, ${userName}!` : "Welcome back!";
    }
    
    const randomGreeting = CHAT_GREETINGS[Math.floor(Math.random() * CHAT_GREETINGS.length)];
    if (!userName) return randomGreeting;
    
    return `Hello, ${userName}! ${randomGreeting}`;
}
