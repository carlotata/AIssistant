export const STUDY_PROMPTS = [
    "Please analyze these files and help me study them. Break down the key concepts and let me know when you're ready for a quiz!",
    "I've attached some study materials. Can you summarize the main points and then prepare a practice quiz to test my memory?",
    "Help me understand these documents. Create a brief study guide and hint at what kind of questions you'd ask in a quiz.",
    "Scan these files and explain the most difficult concepts in simple terms. Once I've reviewed them, I'd love to take a quiz!",
    "Review these attachments and prepare a few practice questions to test my knowledge—I want to be quiz-ready!",
    "Can you go through these files and list the top 5 key takeaways? Afterward, let's do a quick quiz to see if I retained them.",
    "Analyze these materials and act as my tutor. Explain the core ideas and tell me when we can start a quiz on this topic."
];

export function getRandomStudyPrompt() {
    return STUDY_PROMPTS[Math.floor(Math.random() * STUDY_PROMPTS.length)];
}
