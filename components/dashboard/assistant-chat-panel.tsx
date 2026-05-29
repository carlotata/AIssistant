import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { QuizGeneratorButton } from "./assistant-chat-panel-quiz-button";
import { SendIcon, SparklesIcon, PlusIcon, FileIcon, GlobeIcon } from "../icons/dashboard-icons";
import type { ChatMessage, QuickAction, Quiz } from "@/types/dashboard";
import { useFileUpload, type UploadedFile } from "@/lib/use-file-upload";
import { getGreeting } from "@/constants/greetings";
import { getRandomStudyPrompt } from "@/constants/study-prompts";

const getQuizTopicForMessage = (messages: ChatMessage[], messageIndex: number) => {
    const precedingMessages = messages.slice(0, messageIndex + 1).reverse();
    for (const msg of precedingMessages) {
        // First, check for explicit topic indicators
        const topicPattern = /(?:topic|about|on|for|with)\s+([a-zA-Z0-9\s]{1,40}?)(?=\.|\?|!|$|\s+and|\s+that|\s+quiz)/i;
        const topicMatch = msg.content.match(topicPattern);
        if (topicMatch) return topicMatch[1].trim();
        
        // Then check for "[Topic] quiz" structure, capturing only the last word
        const quizPattern = /\b([a-zA-Z0-9]+)\s+quiz/i;
        const quizMatch = msg.content.match(quizPattern);
        if (quizMatch) return quizMatch[1].trim();
    }
    return "General Study Topic";
};
const getQuizCountForMessage = (messages: ChatMessage[], messageIndex: number) => {
    const precedingMessages = messages.slice(0, messageIndex + 1).reverse();
    for (const msg of precedingMessages) {
        const countMatch = msg.content.match(/(\d+)\s*questions?/i);
        if (countMatch) return parseInt(countMatch[1]);
    }
    return 5;
};

function AttachmentPreview({ file, onRemove, progress, isDeletable = true }: { file: any, onRemove: () => void, progress?: number, isDeletable?: boolean }) {
    // Handle both local File, Frontend UploadedFile, and Backend Attachment structures
    const url = file.url || file.fileUrl;
    const name = file.originalName || file.name || 'Unknown File';
    const type = file.mimeType || file.type || '';
    
    const isUploaded = !!url;
    const isImage = type.startsWith('image/');
    
    const imageUrl = isUploaded 
        ? (url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"}${url}`)
        : '';

    return (
        <div className="group relative flex items-center gap-3 p-2.5 pr-4 rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all min-w-45 max-w-sm shadow-lg">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${isUploaded ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-700 text-slate-500 animate-pulse'} overflow-hidden border border-white/5`}>
                {isImage && isUploaded ? <img src={imageUrl} alt={name} className="h-full w-full object-cover" /> : <FileIcon className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-slate-200 truncate leading-none mb-1.5">{name}</p>
                {progress !== undefined && progress > 0 && progress < 100 ? (
                    <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${isUploaded ? 'bg-emerald-500' : 'bg-indigo-400 animate-pulse'}`} />
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{isUploaded ? 'Ready' : 'Uploading...'}</p>
                    </div>
                )}
            </div>
            {isDeletable && (
                <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-slate-950/50 text-slate-500 hover:text-white hover:bg-red-500/20 transition-all cursor-pointer">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
        </div>
    );
}

type AssistantChatPanelProps = {
   messages: ChatMessage[];
   inputValue: string;
   submitting?: boolean;
   className?: string;
   quickActions: QuickAction[];
   onInputChange: (value: string) => void;
   onSubmitMessage: (content: string, searchMode: boolean, attachments?: UploadedFile[]) => void;
   onQuickAction: (action: QuickAction) => void;
   onNavigate: (view: string) => void;
   recentQuizzes: Quiz[];
   user?: any;
};

export function AssistantChatPanel({ messages, inputValue, submitting = false, className = "", quickActions, onInputChange, onSubmitMessage, onQuickAction, onNavigate, recentQuizzes, user }: AssistantChatPanelProps) {
   const messagesEndRef = useRef<HTMLDivElement | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [searchMode, setSearchMode] = useState(false);
   const [showToast, setShowToast] = useState(false);
   const [greeting, setGreeting] = useState("");
   const [attachments, setAttachments] = useState<UploadedFile[]>([]);
   const [isDragging, setIsDragging] = useState(false);
   const { uploadFile, uploading, progress } = useFileUpload();
   
   const toggleSearchMode = () => {
       const nextMode = !searchMode;
       setSearchMode(nextMode);
       if (nextMode) {
           setShowToast(true);
           setTimeout(() => setShowToast(false), 2000);
       }
   };
   
   useEffect(() => {
       setGreeting(getGreeting(user?.name, 'chat'));
   }, [user]);

   useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
   const handleFileTrigger = () => fileInputRef.current?.click();
   
   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
          const uploaded = await uploadFile(file);
          if (uploaded) {
              setAttachments(prev => [...prev, uploaded]);
              if (!inputValue.trim()) {
                  onInputChange(getRandomStudyPrompt());
              }
          }
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
   };

   const handleDrop = async (e: React.DragEvent) => {
       e.preventDefault(); setIsDragging(false);
       const files = Array.from(e.dataTransfer.files || []);
       for (const file of files) {
           const uploaded = await uploadFile(file);
           if (uploaded) {
               setAttachments(prev => [...prev, uploaded]);
               if (!inputValue.trim()) {
                   onInputChange(getRandomStudyPrompt());
               }
           }
       }
   };

   const removeAttachment = (index: number) => setAttachments(prev => prev.filter((_, i) => i !== index));
   const handleSubmit = async () => {
       if (submitting || uploading) return;
       if (!inputValue.trim() && attachments.length === 0) return;
       
       onInputChange(""); setAttachments([]);
       onSubmitMessage(inputValue, searchMode, attachments);
   };

   return (
      <section className={`flex flex-col overflow-hidden bg-slate-900 relative ${className} ${isDragging ? 'ring-2 ring-indigo-500 ring-inset' : ''}`} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
         {isDragging && (
             <div className="absolute inset-0 z-50 bg-indigo-600/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                 <div className="bg-slate-900 p-8 rounded-3xl border-2 border-dashed border-indigo-500 flex flex-col items-center gap-4">
                     <PlusIcon className="h-12 w-12 text-indigo-400 animate-bounce" />
                     <p className="text-xl font-bold text-white">Drop to study with these files</p>
                 </div>
             </div>
         )}
         <div className="flex-1 space-y-6 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 scrollbar-hide">
            {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center min-h-100 text-center animate-in fade-in zoom-in duration-500">
                    <div className="mb-6 p-4 rounded-full bg-slate-800/50">
                        <SparklesIcon className="h-10 w-10 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-3">{greeting}</h2>
                    <p className="text-slate-400 max-w-sm">Ask me anything or upload a file to start learning.</p>
                </div>
            )}
            {messages.map((message, index) => {
                    const isAssistant = message.role === "assistant";
                    const isTriggered = /\[\[GENERATE_QUIZ\]\]/.test(message.content);
                    const cleanContent = message.content.replace(/\[\[GENERATE_QUIZ\]\]/g, "").trim();
                    return (
                        <div key={message.id} className={isAssistant ? "flex items-start gap-3" : "flex justify-end"}>
                            {isAssistant && <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-800 border border-slate-700 text-indigo-400"><SparklesIcon className="h-4 w-4" /></div>}
                            <div className={["relative group max-w-[85%] rounded-xl px-4 py-3 text-[14px] leading-relaxed shadow-sm", isAssistant ? "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700" : "bg-indigo-600 text-white rounded-br-none"].join(" ")}>
                                {cleanContent && (
                                    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap 
                                        prose-p:my-0.5 prose-ul:my-0.5 prose-li:my-0
                                        prose-headings:mt-1 prose-headings:mb-0.5 prose-headings:font-bold">
                                        <ReactMarkdown 
                                            components={{
                                                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer" />,
                                                pre: ({node, ...props}) => <pre {...props} className="overflow-x-auto p-3 rounded-lg bg-slate-950 text-xs" />
                                            }}
                                        >{cleanContent}</ReactMarkdown>
                                    </div>
                                )}
                                {message.attachments && message.attachments.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-700">
                                        {message.attachments.map((file, i) => <AttachmentPreview key={i} file={file as any} onRemove={() => {}} isDeletable={false} />)}
                                    </div>
                                )}
                                {isAssistant && isTriggered && (
                                    <div className="mt-3 pt-3 border-t border-slate-700">
                                        <QuizGeneratorButton topic={getQuizTopicForMessage(messages, index)} count={getQuizCountForMessage(messages, index)} conversationId={(message as any).conversationId} onNavigate={onNavigate} recentQuizzes={recentQuizzes} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {submitting && (
                    <div className="flex items-start gap-3">
                        <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-800 text-indigo-400 border border-slate-700"><SparklesIcon className="h-4 w-4 animate-pulse" /></div>
                        <div className="rounded-xl rounded-tl-none border border-slate-700 bg-slate-800 px-4 py-3"><div className="flex gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" /><span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" /><span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" /></div></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
             </div>
         <footer className="border-t border-white/5 p-4 bg-slate-900 relative">
            {showToast && (
                <div className="absolute -top-10 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-fit mx-auto sm:w-max z-20 px-3 py-1.5 rounded-full bg-slate-800 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold shadow-xl animate-in fade-in zoom-in-95 duration-300 pointer-events-none text-center">
                    Web Search Mode Enabled
                </div>
            )}
            {attachments.length > 0 && <div className="mb-4 flex flex-wrap gap-2">{attachments.map((file, i) => <AttachmentPreview key={i} file={file} onRemove={() => removeAttachment(i)} isDeletable={!submitting && !uploading} />)}</div>}
            
            <div className={`relative flex items-center rounded-xl border transition-all duration-300 ${submitting || uploading ? 'border-indigo-500/20 bg-slate-900/50 opacity-60' : 'border-slate-700 bg-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20'} p-2`}>
               <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple disabled={submitting || uploading} />
               <div className="flex items-center gap-1">
                  <button 
                    type="button" 
                    onClick={handleFileTrigger} 
                    disabled={submitting || uploading} 
                    className="p-2 rounded-lg cursor-pointer text-slate-400 hover:text-white disabled:cursor-not-allowed disabled:hover:text-slate-600 transition-colors" 
                    title="Attach"
                  >
                    {uploading ? <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <PlusIcon className="h-5 w-5" />}
                  </button>
                  <button 
                    type="button" 
                    onClick={toggleSearchMode} 
                    disabled={submitting || uploading}
                    className={`p-2 rounded-lg cursor-pointer transition-all ${searchMode ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'} disabled:opacity-30 disabled:cursor-not-allowed`} 
                    title="Search"
                  >
                    <GlobeIcon className="h-5 w-5" />
                  </button>
               </div>
               <input 
                 value={inputValue} 
                 onChange={(e) => onInputChange(e.target.value)} 
                 onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }} 
                 disabled={submitting || uploading} 
                 placeholder={uploading ? "Uploading files..." : submitting ? "AIssistant is responding..." : (searchMode ? "Searching live web..." : "Message AIssistant...")} 
                 className="flex-1 bg-transparent px-2 text-[14px] text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed" 
               />
               <button 
                 type="button" 
                 onClick={handleSubmit} 
                 disabled={submitting || uploading || (!inputValue.trim() && attachments.length === 0)} 
                 className="p-2 text-indigo-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
               >
                 {submitting ? <SparklesIcon className="h-5 w-5 animate-pulse" /> : <SendIcon className="h-5 w-5" />}
               </button>
            </div>
            
            <div className="mt-4 flex flex-row gap-2 justify-between sm:justify-start sm:w-fit">
               {quickActions.map((action) => (
                  <button 
                    key={action.id} 
                    type="button" 
                    onClick={() => !submitting && !uploading && onQuickAction(action)} 
                    disabled={submitting || uploading} 
                    className="flex-1 sm:flex-none truncate rounded-lg border border-white/5 bg-slate-800 px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-indigo-500 hover:text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    {action.label}
                  </button>
               ))}
            </div>
         </footer>
      </section>
   );
}
