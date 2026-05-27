export function getGreeting(userName?: string) {
    if (!userName) return "Welcome back!";
    return `Welcome back, ${userName}!`;
}
