import fs from "fs";
import path from "path";

const AGENTS_DIR = path.join(process.cwd(), "agents");

function loadAgent(name: string) {
  return fs.readFileSync(path.join(AGENTS_DIR, `${name}.md`), "utf-8");
}

export const guardPrompt = loadAgent("guard");

export const agents = [
  { name: "MELCHIOR" as const, system: loadAgent("melchior") },
  { name: "BALTHASAR" as const, system: loadAgent("balthasar") },
  { name: "CASPER" as const, system: loadAgent("casper") },
];
