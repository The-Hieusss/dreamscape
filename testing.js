import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
    apiKey: 'AIzaSyDuz51qP5zjtsXiJdUzfPJe05l-fqnHEDQ',
});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Write a short poem about the sea in 4 lines.",
  });
  console.log(response.text);
}

main();