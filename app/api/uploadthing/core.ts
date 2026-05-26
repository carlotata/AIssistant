import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // Define an endpoint for image/document attachments
  messageAttachment: f({ 
      image: { maxFileSize: "4MB", maxFileCount: 1 },
      pdf: { maxFileSize: "8MB", maxFileCount: 1 },
      text: { maxFileSize: "1MB", maxFileCount: 1 }
  })
    .onUploadComplete(async ({ file }) => {
      console.log("Upload complete:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
