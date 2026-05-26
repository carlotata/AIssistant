"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ListChecksIcon, ChatIcon, TrendUpIcon } from "../icons/dashboard-icons";
import type { StudyProgress } from "@/types/dashboard";

type ProgressViewProps = {
    onNavigate: (view: string) => void;
    onResume: () => void;
};

export function ProgressView({ onNavigate, onResume }: ProgressViewProps) {
    const [progress, setProgress] = useState<StudyProgress | null>(null);
    const [topicBreakdown, setTopicBreakdown] = useState<Record<string, number>>({});
    const [insights, setInsights] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch<{ studyProgress: StudyProgress, topicBreakdown: Record<string, number>, insights: string[] }>("/study-progress").then(data => {
            setProgress(data.studyProgress);
            setTopicBreakdown(data.topicBreakdown);
            setInsights(data.insights);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="text-slate-400 p-8">Loading analysis...</div>;

    // Helper for improved progress bar
    const ProgressBar = ({ label, score }: { label: string, score: number }) => (
        <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-300">{label}</span>
                <span className="font-bold text-white">{Math.round(score)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-sm overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                    style={{ width: `${Math.min(score, 100)}%` }}
                />
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <TrendUpIcon className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white">Learning Analytics</h1>
                    <p className="text-slate-400">Tracking your mastery and study consistency.</p>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-lg bg-slate-900 border border-white/5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Mastery Level</p>
                    <p className="text-4xl font-black text-white mt-3">{progress?.completedTopics ?? 0}</p>
                    <p className="text-sm text-indigo-400 mt-1">Topics fully mastered</p>
                </div>
                <div className="p-6 rounded-lg bg-slate-900 border border-white/5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Quiz Performance</p>
                    <p className="text-4xl font-black text-white mt-3">{Math.round(progress?.averageScore ?? 0)}%</p>
                    <p className="text-sm text-green-400 mt-1">Overall accuracy</p>
                </div>
                <div className="p-6 rounded-lg bg-slate-900 border border-white/5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Study Time</p>
                    <p className="text-4xl font-black text-white mt-3">{(progress as any)?.activeDays * 45}m</p>
                    <p className="text-sm text-indigo-400 mt-1">Estimated minutes</p>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-lg bg-slate-900 border border-white/5">
                    <h2 className="text-lg font-bold text-white mb-6">Topic Proficiency</h2>
                    <div className="space-y-6 h-64 overflow-y-auto pr-4">
                        {Object.entries(topicBreakdown).length === 0 ? (
                            <p className="text-slate-500 text-sm">No quizzes completed yet.</p>
                        ) : (
                            Object.entries(topicBreakdown)
                                .sort(([, a], [, b]) => b - a)
                                .map(([topic, score]) => (
                                    <ProgressBar key={topic} label={topic.charAt(0).toUpperCase() + topic.slice(1)} score={score} />
                                ))
                        )}
                    </div>
                </div>

                <div className="p-8 rounded-lg bg-slate-900 border border-white/5">
                    <h2 className="text-lg font-bold text-white mb-6">Recent Insights</h2>
                    <ul className="space-y-4">
                        {insights.map((insight, index) => {
                            const reviewMatch = insight.match(/Consider reviewing\s+([a-zA-Z0-9\s]+?)(?=\,|$)/i);
                            const extractedTopic = reviewMatch ? reviewMatch[1].trim() : null;

                            return (
                                <li key={index} className="flex flex-col gap-3 text-sm text-slate-300 bg-slate-800/50 p-4 rounded-lg">
                                    <div className="flex gap-3">
                                        <ListChecksIcon className="h-5 w-5 text-indigo-400 mt-0.5" />
                                        <span>{insight}</span>
                                    </div>
                                    {extractedTopic && (
                                        <button 
                                            onClick={() => onNavigate(`quiz&topic=${encodeURIComponent(extractedTopic)}`)}
                                            className="w-full text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors"
                                        >
                                            Study {extractedTopic} Now →
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    <div className="mt-8 pt-6 border-t border-white/5 flex gap-3">
                        <button onClick={() => onNavigate("quiz")} className="flex-1 px-4 py-3 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-500 transition-colors cursor-pointer">
                           Create New Quiz
                        </button>
                        <button onClick={onResume} className="flex-1 px-4 py-3 bg-slate-800 text-slate-200 text-sm font-bold rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                           Resume Study
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
