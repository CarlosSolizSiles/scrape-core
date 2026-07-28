import ollama from "ollama";
import { SYSTEM_PROMPT } from "./Prompt.js";

class AIExtractor {
  private model: string;
  private ready: boolean;

  constructor() {
    this.model = "qwen3:8b";
    this.ready = false;
  }

  async init() {
    if (this.ready) return;

    await ollama.generate({
      model: this.model,
      prompt: "",
      keep_alive: -1,
      stream: false,
    });

    this.ready = true;
  }

  async extract(html: string) {
    await this.init();

    const res = await ollama.generate({
      model: this.model,
      keep_alive: -1,
      format: "json",
      think: false,
      prompt: `${SYSTEM_PROMPT}\n\n\`\`\`html\n${html}\n\`\`\``,
    });

    return JSON.parse(res.response);
  }
}

export default new AIExtractor();
