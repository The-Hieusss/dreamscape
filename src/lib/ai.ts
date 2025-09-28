import { GoogleGenerativeAI } from "@google/generative-ai";
import { models } from "../lib/ModelRegistry";

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateCommand(input: string) {
  // Build a list of available models for the LLM
  const availableModels = models.map(
    (m) => `${m.name} (category: ${m.category}, path: ${m.path})`
  );

  const prompt = `
You are an assistant that translates natural language into JSON world-building commands.

Available models:
${availableModels.join("\n")}

Themes:
- "universe": stars, sun, moon, dark sky
- "forest": trees, rocks, mountains
- "city": skyscrapers, cars, flat terrain
- "ocean": water, fish, sharks
- "desert": sand, cacti, rocks

Schema:
{
  "action": "add_object" | "remove_object" | "modify_world" | "set_theme",
  "object"?: {
    "type": string,
    "modelPath"?: string,
    "quantity"?: number,
    "position"?: "random" | [x,y,z],
    "color"?: string,
    "size"?: number,
    "animation"?: string,
    "speed"?: number
  },
  "changes"?: {
    "sky_color"?: string,
    "terrain"?: "mountainous" | "flat plains" | "heightmap",
    "theme"?: "universe" | "forest" | "city" | "ocean" | "desert"
  }
}

Size rules:
- "tiny" or "small" → size = 0.5
- "medium" or "normal" → size = 1.0
- "large" → size = 2.0
- "huge" or "giant" → size = 3.0
Default size = 1.0 if not specified.

Animation rules:
- "graze", "eat" → "Eating"
- "idle", "stand" → "Idle"
- "walk", "wander" → "Walk", speed ~0.01–0.02
- "gallop", "run fast" → "Walk", speed ~0.05
Default = "Idle"

Examples:
"Add 5 trees" =>
{ "action": "add_object", "object": { "type": "tree", "modelPath": "/models/Trees/Trees.glb", "quantity": 5, "position": "random" } }

"Add a small house" =>
{ "action": "add_object", "object": { "type": "house", "modelPath": "/models/House.glb", "quantity": 1, "position": "random", "size": 0.5 } }

"Remove all cars" =>
{ "action": "remove_object", "object": { "type": "car" } }

"Make a mountainous terrain" =>
{ "action": "modify_world", "changes": { "terrain": "mountainous" } }

"Change sky to pink" =>
{ "action": "modify_world", "changes": { "sky_color": "pink" } }

"Create a city world" =>
{ "action": "set_theme", "changes": { "theme": "city" } }

"Turn this into a forest" =>
{ "action": "set_theme", "changes": { "theme": "forest" } }

"Make cows graze" =>
{ "action": "add_object", "object": { "type": "cow", "quantity": 5, "position": "random", "animation": "Eating" } }

"Make cows walk around slowly" =>
{ "action": "add_object", "object": { "type": "cow", "quantity": 3, "position": "random", "animation": "Walk", "speed": 0.01 } }

"Make horses gallop fast" =>
{ "action": "add_object", "object": { "type": "horse", "quantity": 2, "position": "random", "animation": "Walk", "speed": 0.05 } }


When spawning multiple animals (like cows, sheep, fish), assign random Y rotation so they don’t all face the same way.

IMPORTANT: Always output valid JSON only, no explanations or markdown fences.

User input: "${input}"
`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();

  if (text.startsWith("```")) {
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse Gemini response:", text, err);
    return null;
  }
}
