import { parse } from "./parser.js"
import { analyze } from "./analyzer.js"
import { optimize } from "./optimizer.js"
import { generate } from "./generator.js"

export function compile(source, options = {}) {
  const ast = parse(source)
  if (options.syntaxOnly || options.parseOnly) return ast
  const analyzed = analyze(ast)
  if (options.analyzeOnly) return analyzed
  const optimized = optimize(analyzed)
  if (options.optimizeOnly) return optimized
  return generate(optimized)
}
