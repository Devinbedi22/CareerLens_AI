import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "nextstep-ai", // Unique app ID
  name: "NextStep AI",
  credentials: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
    },
  },
});