import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

console.log("DEBUG: UploadThing Token present:", !!process.env.UPLOADTHING_TOKEN);

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
