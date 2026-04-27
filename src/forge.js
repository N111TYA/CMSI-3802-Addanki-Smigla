#!/usr/bin/env node
import { readFileSync } from "fs"
import { compile } from "./compiler.js"

const [, , flag, file] = process.argv

const modes = {
  "--check": { syntaxOnly: true },
  "--parse": { parseOnly: true },
  "--analyze": { analyzeOnly: true },
  "--optimize": { optimizeOnly: true },
  "--generate": {},
}

if (!flag || !modes[flag] || !file) {
  process.stderr.write("Usage: forge --check|--parse|--analyze|--optimize|--generate <file>\n")
  process.exit(1)
}

try {
  const source = readFileSync(file, "utf8")
  const result = compile(source, modes[flag])
  if (typeof result === "string") {
    process.stdout.write(result + "\n")
  } else {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n")
  }
} catch (e) {
  process.stderr.write(e.message + "\n")
  process.exit(1)
}
