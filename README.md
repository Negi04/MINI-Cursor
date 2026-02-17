# 🖱️ MINI-Cursor

A lightweight AI coding agent built with Node.js, inspired by [Cursor](https://cursor.sh) — the AI-powered code editor. MINI-Cursor brings agentic AI capabilities to your terminal, allowing you to interact with an LLM that can reason through and assist with coding tasks.

---

## 🚀 Features

- **AI-Powered Agent Loop** — Sends prompts to an LLM and processes responses in an agentic loop
- **Tool Use** — Supports AI tool calling for tasks like reading files, writing code, and executing commands
- **Terminal-Based** — Runs entirely from the command line, no GUI required
- **Node.js Native** — Built with JavaScript for easy customization and extension

---

## 📁 Project Structure

```
MINI-Cursor/
├── index.js          # Main entry point — agent loop and tool definitions
├── package.json      # Project metadata and dependencies
├── package-lock.json # Locked dependency versions
└── node_modules/     # Installed dependencies
```

---

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- An API key for your chosen LLM provider (e.g., OpenAI, Anthropic)

---

## ⚙️ Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Negi04/MINI-Cursor.git
   cd MINI-Cursor
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up your API key:**

   Create a `.env` file in the root directory and add your API key:

   ```env
   OPENAI_API_KEY=your_api_key_here
   # or
   ANTHROPIC_API_KEY=your_api_key_here
   ```

---

## ▶️ Usage

Run the agent with:

```bash
node index.js
```

Then type your prompt and let the agent reason through and respond to your request.

---

## 🧠 How It Works

MINI-Cursor implements a basic **agentic loop**:

1. The user provides a task or question
2. The agent sends the message to the LLM along with available tool definitions
3. If the LLM decides to use a tool, the agent executes it and sends the result back
4. This loop continues until the LLM produces a final response
5. The response is displayed to the user

This mirrors the core loop used by tools like Cursor, Devin, and Claude Code.

---

## 📦 Dependencies

Dependencies are listed in `package.json`. The project uses npm packages to handle LLM API communication and any tooling utilities.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Open an issue to report bugs or suggest features
- Submit a pull request with improvements

Please keep PRs focused and include a clear description of what you've changed and why.

---

## 📄 License

This project is open source. See the repository for license details.

---

## 🙏 Acknowledgements

Inspired by [Cursor](https://cursor.sh) and the broader ecosystem of AI coding agents. Built as a learning project to understand how agentic AI loops and tool use work under the hood.

