import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import { exec } from "child_process";
import util from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import readline from "readline";

// ─── Config ────────────────────────────────────────────────────────────────
const PLATFORM = os.platform();
const MODEL = "gemini-2.5-flash";
const MAX_TOOL_ROUNDS = 30; // safety limit per user request

const execute = util.promisify(exec);
const ai = new GoogleGenAI({});

// ─── Tool implementations ────────────────────────────────────────────────────

async function runCommand({ command }) {
  try {
    const { stdout, stderr } = await execute(command, { shell: true, timeout: 30_000 });
    const out = stdout.trim();
    const err = stderr.trim();
    if (err) return `STDERR: ${err}${out ? `\nSTDOUT: ${out}` : ""}`;
    return out || "OK";
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

async function writeFile({ path: filePath, content }) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, "utf8");
    return `Wrote ${filePath} (${content.length} bytes)`;
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

async function readFile({ path: filePath }) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

// ─── Tool declarations ───────────────────────────────────────────────────────

const toolDeclarations = [
  {
    name: "runCommand",
    description:
      "Execute any shell/terminal command (mkdir, npm install, open, ls, etc.). " +
      "Do NOT use this to write file content — use writeFile instead.",
    parameters: {
      type: "OBJECT",
      properties: {
        command: {
          type: "STRING",
          description: `Shell command appropriate for ${PLATFORM}. E.g. "mkdir -p calculator"`,
        },
      },
      required: ["command"],
    },
  },
  {
    name: "writeFile",
    description:
      "Create or overwrite a file with the given content. " +
      "Always use this (not echo/cat/heredoc) for ANY multi-line content.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File path, e.g. calculator/index.html" },
        content: { type: "STRING", description: "Full file content to write." },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "readFile",
    description: "Read and return the contents of a file to verify or debug it.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File path to read." },
      },
      required: ["path"],
    },
  },
];

// ─── Tool dispatcher ──────────────────────────────────────────────────────────

async function dispatchTool(name, args) {
  switch (name) {
    case "runCommand": return runCommand(args);
    case "writeFile":  return writeFile(args);
    case "readFile":   return readFile(args);
    default:           return `Unknown tool: ${name}`;
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are an expert AI website builder (like Cursor, but for full websites).
Your job: turn the user request into a fully working website using tool calls.

Operating system: ${PLATFORM}

RULES:
1. Create the project folder first with runCommand (e.g. mkdir -p myapp).
2. Use writeFile for ALL file content. Never use echo/printf/heredoc.
3. Write complete, production-quality code — no placeholders or TODOs.
4. Verify written files with readFile to catch any issues.
5. If a tool returns an error, diagnose and fix before continuing.
6. When done, print a short summary of what was built and how to run/open it.
7. Issue one tool call at a time and wait for the result.
`.trim();

// ─── Agentic loop ─────────────────────────────────────────────────────────────

const history = [];

async function runAgent(userMessage) {
  history.push({ role: "user", parts: [{ text: userMessage }] });

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: history,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    const calls = response.functionCalls;

    if (!calls || calls.length === 0) {
      const text = response.text;
      if (text) {
        console.log(`\n🤖  ${text}\n`);
        history.push({ role: "model", parts: [{ text }] });
      } else {
        console.error("⚠️  Empty response from model.");
      }
      return;
    }

    history.push({ role: "model", parts: calls.map((c) => ({ functionCall: c })) });

    const responseParts = [];
    for (const call of calls) {
      const { name, args } = call;
      const preview = JSON.stringify(args).slice(0, 100);
      console.log(`  ⚙️  ${name}(${preview}${preview.length >= 100 ? "..." : ""})`);
      const result = await dispatchTool(name, args);
      const resultPreview = String(result).slice(0, 200);
      console.log(`     ↳ ${resultPreview}${String(result).length > 200 ? "…" : ""}`);
      responseParts.push({ functionResponse: { name, response: { result } } });
    }

    history.push({ role: "user", parts: responseParts });
  }

  console.error(`⚠️  Reached tool-call limit (${MAX_TOOL_ROUNDS}). Stopping.`);
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = (q) => new Promise((resolve) => rl.question(q, resolve));

console.log("🚀  Mini Cursor — AI Website Builder");
console.log("   Type your request, or 'exit' to quit.\n");

while (true) {
  const input = (await prompt("You → ")).trim();
  if (!input) continue;
  if (input.toLowerCase() === "exit") {
    console.log("Bye!");
    rl.close();
    break;
  }
  await runAgent(input);
}