import { useEffect, useRef, useState } from "react";
import { QuizGeneratorButton } from "./assistant-chat-panel-quiz-button";
import { SendIcon, SparklesIcon, PlusIcon, FileIcon, GlobeIcon, FileTextIcon } from "../icons/dashboard-icons";
import type { ChatMessage, QuickAction, Quiz } from "@/types/dashboard";
import { apiFetch, ensureCsrfToken } from "@/lib/api";
import { useFileUpload, type UploadedFile } from "@/lib/use-file-upload";

// ... Helper to strip markdown ... (removed as previously requested)

// Scoped topic parsing
const getQuizTopicForMessage = (messages: ChatMessage[], messageIndex: number) => {
    const precedingMessages = messages.slice(0, messageIndex + 1).reverse();
    for (const msg of precedingMessages) {
        const topicMatch = msg.content.match(/(?:topic|about|on)\s+([a-zA-Z0-9\s]+?)(?=\.|\?|!|$)/i);
        if (topicMatch) return topicMatch[1].trim();
    }
    return "General Study Topic";
};

// Scoped count parsing
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
        <div className="relative flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 animate-in slide-in-from-bottom-2 fade-in duration-200 min-w-[200px] max-w-sm">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-500 text-white overflow-hidden">
                {isImage && isUploaded ? (
                    <img src={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"}${file.url}`} alt={name} className="h-full w-full object-cover" />
                ) : (
                    <FileIcon className="h-5 w-5" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{name}</p>
                {progress !== undefined && progress < 100 ? (
                    <div className="mt-1 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                ) : (
                    <p className="text-[10px] text-indigo-300 uppercase tracking-widest">{isUploaded ? 'Ready to send' : 'Preparing...'}</p>
                )}
            </div>
            <button onClick={onRemove} className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-800/50 rounded-full">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
}

function ImageLightbox({ url, name, onClose }: { url: string, name: string, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4" onClick={onClose}>
            <button onClick={onClose} className="absolute top-6 right-6 p-3 text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img src={url} alt={name} className="max-h-full max-w-full rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()} />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 px-6 py-3 rounded-full border border-white/10 text-white font-bold text-sm">
                {name}
            </div>
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
};

export function AssistantChatPanel({
   messages,
   inputValue,
   submitting = false,
   className = "",
   quickActions,
   onInputChange,
   onSubmitMessage,
   onQuickAction,
   onNavigate,
   recentQuizzes,
}: AssistantChatPanelProps) {
   const messagesEndRef = useRef<HTMLDivElement | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [searchMode, setSearchMode] = useState(false);
   const [attachments, setAttachments] = useState<UploadedFile[]>([]);
   const [isDragging, setIsDragging] = useState(false);
   const [lightboxImage, setLightboxImage] = useState<{ url: string, name: string } | null>(null);
   
   const { uploadFile, uploading, progress } = useFileUpload();

   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [messages]);

   const handleFileTrigger = () => {
      fileInputRef.current?.click();
   };

   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const uploaded = await uploadFile(file);
          if (uploaded) {
              setAttachments(prev => [...prev, uploaded]);
          }
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
   };

   const handleDrop = async (e: React.DragEvent) => {
       e.preventDefault();
       setIsDragging(false);
       const file = e.dataTransfer.files?.[0];
       if (file) {
           const uploaded = await uploadFile(file);
           if (uploaded) {
               setAttachments(prev => [...prev, uploaded]);
           }
       }
   };

   const removeAttachment = (index: number) => {
       setAttachments(prev => prev.filter((_, i) => i !== index));
   };

   const handleSubmit = () => {
       if (!inputValue.trim() && attachments.length === 0) return;
       onSubmitMessage(inputValue, searchMode, attachments);
       setAttachments([]);
   };

   const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

   return (
      <section 
        className={`flex flex-col overflow-hidden bg-slate-900 relative ${className} ${isDragging ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
         {isDragging && (
             <div className="absolute inset-0 z-50 bg-indigo-600/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                 <div className="bg-slate-900 p-8 rounded-3xl border-2 border-dashed border-indigo-500 flex flex-col items-center gap-4">
                     <PlusIcon className="h-12 w-12 text-indigo-400 animate-bounce" />
                     <p className="text-xl font-bold text-white">Drop to study with this file</p>
                 </div>
             </div>
         )}

         {lightboxImage && (
             <ImageLightbox url={lightboxImage.url} name={lightboxImage.name} onClose={() => setLightboxImage(null)} />
         )}

         <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/20 text-indigo-400">
                     <SparklesIcon className="h-6 w-6" />
                 </div>
                 <h2 className="text-lg font-bold text-white">Study Assistant</h2>
             </div>
             {uploading && (
                 <div className="flex items-center gap-2 text-indigo-400">
                     <span className="text-xs font-bold animate-pulse">Uploading...</span>
                     <div className="h-1 w-20 bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} />
                     </div>
                 </div>
             )}
         </header>

         <div className="flex-1 space-y-8 overflow-y-auto px-6 py-10">
            {messages.map((message, index) => {
                const isAssistant = message.role === "assistant";
                const isTriggered = /\[\[GENERATE_QUIZ\]\]/.test(message.content);
                const cleanContent = message.content.replace(/\[\[GENERATE_QUIZ\]\]/g, "").trim();
                
                return (
                    <div key={message.id} className={isAssistant ? "flex items-start gap-4" : "flex justify-end"}>
                        {isAssistant && (
                            <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-800 text-indigo-400 border border-slate-700 shadow-inner">
                                <SparklesIcon className="h-5 w-5" />
                            </div>
                        )}
                        <div className={[
                            "max-w-[85%] rounded-2xl px-6 py-4 text-[15px] leading-relaxed shadow-sm",
                            isAssistant 
                                ? "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700" 
                                : "bg-indigo-600 text-white rounded-br-none shadow-indigo-900/20"
                        ].join(" ")}>
                            {cleanContent && (
                                <div className="whitespace-pre-wrap">{cleanContent}</div>
                            )}

                            {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white/10 pt-4">
                                    {message.attachments.map((file, i) => (
                                        <AttachmentPreview key={i} file={file as any} onRemove={() => {}} />
                                    ))}
                                </div>
                            )}

                            {isAssistant && isTriggered && (
                                <QuizGeneratorButton 
                                    topic={getQuizTopicForMessage(messages, index)} 
                                    count={getQuizCountForMessage(messages, index)} 
                                    conversationId={(message as any).conversationId} 
                                    onNavigate={onNavigate} 
                                    recentQuizzes={recentQuizzes} 
                                />
                            )}
                        </div>
                    </div>
                );
            })}
            {submitting && (
                <div className="flex items-start gap-4">
                    <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-800 text-indigo-400 border border-slate-700 shadow-inner">
                        <SparklesIcon className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="rounded-2xl rounded-tl-none border border-slate-700 bg-slate-800 px-5 py-4 shadow-sm">
                        <div className="flex gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" /><span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" /><span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" /></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
         </div>

         <footer className="border-t border-white/5 p-6 bg-slate-900">
            {attachments.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-3">
                    {attachments.map((file, i) => (
                        <AttachmentPreview key={i} file={file} onRemove={() => removeAttachment(i)} />
                    ))}
                </div>
            )}

            <div className="relative flex items-center rounded-xl border border-slate-700 bg-slate-800 p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
               <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xls,.xlsx,.ppt,.pptx,.webp,.gif,image/*,application/pdf"
               />
               
               <button
                  type="button"
                  onClick={handleFileTrigger}
                  disabled={uploading}
                  className="p-1.5 mr-1 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-40"
                  title="Attach file"
                  aria-label="Attach file">
                  {uploading ? <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <PlusIcon className="h-5 w-5" />}
               </button>

               <button
                  type="button"
                  onClick={() => setSearchMode(!searchMode)}
                  className={`p-1.5 mr-2 rounded-lg transition-all cursor-pointer ${searchMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  title="Web Search Mode"
                  aria-label="Toggle web search">
                  <GlobeIcon className="h-5 w-5" />
                  {searchMode && <span className="absolute -top-1 -right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
               </button>
               
               <input
                  value={inputValue}
                  onChange={(event) => onInputChange(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handleSubmit(); } }}
                  disabled={submitting}
                  placeholder={searchMode ? "Search the web..." : "Send a message..."}
                  className="flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-60"
               />
               <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || uploading || (!inputValue.trim() && attachments.length === 0)}
                  className="p-1.5 text-indigo-400 hover:text-white disabled:opacity-40 cursor-pointer"
                  aria-label="Send message">
                  <SendIcon className="h-5 w-5" />
               </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
               {quickActions.map((action) => (
                  <button
                     key={action.id}
                     type="button"
                     onClick={() => onQuickAction(action)}
                     className="rounded-xl border border-white/5 bg-slate-800 px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all hover:bg-indigo-500 hover:text-white cursor-pointer">
                     {action.label}
                  </button>
               ))}
            </div>
         </footer>
      </section>
   );
}
