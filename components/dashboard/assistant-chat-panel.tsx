import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { QuizGeneratorButton } from "./assistant-chat-panel-quiz-button";
import { SendIcon, SparklesIcon, PlusIcon, FileIcon, GlobeIcon } from "../icons/dashboard-icons";
import type { ChatMessage, QuickAction, Quiz } from "@/types/dashboard";
import { useFileUpload, type UploadedFile } from "@/lib/use-file-upload";
import { getGreeting } from "@/constants/greetings";

const getQuizTopicForMessage = (messages: ChatMessage[], messageIndex: number) => {
    const precedingMessages = messages.slice(0, messageIndex + 1).reverse();
    for (const msg of precedingMessages) {
        const topicMatch = msg.content.match(/(?:topic|about|on)\s+([a-zA-Z0-9\s]{1,40}?)(?=\.|\?|!|$|\s+and|\s+that)/i);
        if (topicMatch) return topicMatch[1].trim();
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
function AttachmentPreview({ file, onRemove, progress }: { file: UploadedFile | File, onRemove: () => void, progress?: number }) {
    const isUploaded = 'url' in file;
    const name = 'originalName' in file ? file.originalName : file.name;
    const type = 'mimeType' in file ? file.mimeType : file.type;
    const isImage = type.startsWith('image/');
    return (
        <div className="group relative flex items-center gap-2.5 p-2 pr-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-indigo-500/50 transition-all min-w-50 max-w-sm">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-indigo-500/10 text-indigo-400 overflow-hidden border border-indigo-500/20">
                {isImage && isUploaded ? <img src={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"}${file.url}`} alt={name} className="h-full w-full object-cover" /> : <FileIcon className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-200 truncate">{name}</p>
                {progress !== undefined && progress < 100 ? (
                    <div className="mt-1 h-0.5 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                ) : <p className="text-[9px] text-slate-500 uppercase tracking-wider">{isUploaded ? 'Attached' : 'Uploading...'}</p>}
            </div>
            <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white transition-opacity cursor-pointer">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
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
       setGreeting(getGreeting(user?.name));
   }, [user]);

   useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
   const handleFileTrigger = () => fileInputRef.current?.click();
   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const uploaded = await uploadFile(file);
          if (uploaded) setAttachments(prev => [...prev, uploaded]);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
   };
   const handleDrop = async (e: React.DragEvent) => {
       e.preventDefault(); setIsDragging(false);
       const file = e.dataTransfer.files?.[0];
       if (file) {
           const uploaded = await uploadFile(file);
           if (uploaded) setAttachments(prev => [...prev, uploaded]);
       }
   };
   const removeAttachment = (index: number) => setAttachments(prev => prev.filter((_, i) => i !== index));
   const handleSubmit = async () => {
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
                     <p className="text-xl font-bold text-white">Drop to study with this file</p>
                 </div>
             </div>
         )}
         {messages.length === 0 && (
             <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
                 <div className="mb-6 p-4 rounded-full bg-slate-800/50">
                    <SparklesIcon className="h-10 w-10 text-indigo-400" />
                 </div>
                 <h2 className="text-3xl font-bold text-white mb-3">{greeting}</h2>
                 <p className="text-slate-400 max-w-sm">Ask me anything or upload a file to start learning.</p>
             </div>
         )}
         {messages.length > 0 && (
             <div className="flex-1 space-y-6 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 scrollbar-hide">
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
                                        prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 
                                        prose-headings:mt-2 prose-headings:mb-1 prose-headings:font-bold">
                                        <ReactMarkdown 
                                            components={{
                                                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer" />
                                            }}
                                        >{cleanContent}</ReactMarkdown>
                                    </div>
                                )}
                                {message.attachments && message.attachments.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-700">
                                        {message.attachments.map((file, i) => <AttachmentPreview key={i} file={file as any} onRemove={() => {}} />)}
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
         )}
         <footer className="border-t border-white/5 p-4 bg-slate-900 relative">
            {showToast && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-slate-800 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-xl animate-in fade-in zoom-in-95 duration-300 pointer-events-none">
                    Web Search Mode Enabled
                </div>
            )}
            {attachments.length > 0 && <div className="mb-4 flex flex-wrap gap-2">{attachments.map((file, i) => <AttachmentPreview key={i} file={file} onRemove={() => removeAttachment(i)} />)}</div>}
            <div className="relative flex items-center rounded-xl border border-slate-700 bg-slate-800 p-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
               <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
               <div className="flex items-center">
                  <button type="button" onClick={handleFileTrigger} disabled={uploading} className="p-2 rounded-lg cursor-pointer text-slate-400 hover:text-white" title="Attach"><PlusIcon className="h-5 w-5" /></button>
                  <button type="button" onClick={toggleSearchMode} className={`p-2 rounded-lg cursor-pointer transition-colors ${searchMode ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'}`} title="Search"><GlobeIcon className="h-5 w-5" /></button>
               </div>
               <input value={inputValue} onChange={(e) => onInputChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }} disabled={submitting} placeholder={searchMode ? "Searching live web..." : "Message assistant..."} className="flex-1 bg-transparent px-2 text-[14px] text-white outline-none placeholder:text-slate-500" />
               <button type="button" onClick={handleSubmit} disabled={submitting || uploading} className="p-2 text-indigo-400 hover:text-white cursor-pointer"><SendIcon className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 justify-center sm:justify-start">
               {quickActions.map((action) => (
                  <button key={action.id} type="button" onClick={() => !submitting && onQuickAction(action)} disabled={submitting} className="rounded-lg border border-white/5 bg-slate-800 px-2.5 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-indigo-500 hover:text-white cursor-pointer">{action.label}</button>
               ))}
            </div>
         </footer>
      </section>
   );
}
