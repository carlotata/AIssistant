export const GREETINGS = [
    "What's on your mind today?",
    "Ready to explore something new?",
    "What are we curious about?",
    "Let's make some progress.",
    "Anything interesting to dive into?"
];

export function getGreeting(userName?: string) {
    const namePart = userName ? `, ${userName}` : "";
    const randomGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    return `${randomGreeting}${namePart ? ` ${namePart}` : ""}`;
}
