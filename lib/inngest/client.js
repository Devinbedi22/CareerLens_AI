import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "CareerLensAI", // Unique app ID
  name: "CareerLensAI ",
  credentials: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
    },
  },
});