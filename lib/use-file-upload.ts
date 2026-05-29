import { useState } from "react";
import { apiFetch, ensureCsrfToken, BACKEND_URL } from "../lib/api";

export type UploadedFile = {
    url: string;
    originalName: string;
    mimeType: string;
    size: number;
    data?: string; // Base64 data for scanning
    extractedText?: string;
};

export const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "text/plain",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useFileUpload() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = async (file: File): Promise<UploadedFile | null> => {
        setUploading(true);
        setProgress(0);
        setError(null);

        // Validation
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            setError(`File type ${file.type} is not supported.`);
            setUploading(false);
            return null;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError("File size exceeds the 10MB limit.");
            setUploading(false);
            return null;
        }

        try {
            const csrfToken = await ensureCsrfToken();
            
            // Read as Base64 for the AI scanning capability
            const base64Data = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    resolve(base64.split(',')[1]);
                };
                reader.readAsDataURL(file);
            });

            const formData = new FormData();
            formData.append("file", file);

            const result = await new Promise<any>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", `${BACKEND_URL}/attachments/upload`);
                xhr.withCredentials = true;
                
                if (csrfToken) {
                    xhr.setRequestHeader("X-CSRF-Token", csrfToken);
                }

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        setProgress(Math.round(percentComplete));
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            resolve(JSON.parse(xhr.responseText));
                        } catch (e) {
                            reject(new Error("Failed to parse server response"));
                        }
                    } else {
                        try {
                            const errorData = JSON.parse(xhr.responseText);
                            reject(new Error(errorData.error?.message || "Upload failed"));
                        } catch (e) {
                            reject(new Error(`Upload failed with status ${xhr.status}`));
                        }
                    }
                };

                xhr.onerror = () => reject(new Error("Network error occurred"));
                xhr.send(formData);
            });

            return {
                ...result,
                data: base64Data
            };
        } catch (err: any) {
            setError(err.message || "Failed to upload file");
            return null;
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    return { uploadFile, uploading, progress, error };
}
