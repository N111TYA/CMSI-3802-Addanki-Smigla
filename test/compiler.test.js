import assert from "assert/strict"
import { compile } from "../src/compiler.js"

function ok(src, opts = {}) {
  assert.doesNotThrow(() => compile(src, opts))
}
function bad(src, pattern, opts = {}) {
  assert.throws(() => compile(src, opts), pattern)
}
function js(src) {
  return compile(src)
}

describe("Compiler", () => {
  describe("syntax-only mode (--check)", () => {
    it("returns AST for valid program", () => {
      const result = compile("let x = 1;", { syntaxOnly: true })
      assert.equal(result.kind, "Program")
    })
    it("throws on syntax error", () => {
      assert.throws(() => compile("let x = 1", { syntaxOnly: true }))
    })
    it("does not run analyzer in syntaxOnly mode", () => {
      ok("let x = y;", { syntaxOnly: true })
    })
  })

  describe("parse-only mode (--parse)", () => {
    it("returns AST for valid program", () => {
      const result = compile("let x = 42;", { parseOnly: true })
      assert.equal(result.kind, "Program")
      assert.equal(result.statements[0].initializer.value, 42)
    })
    it("skips analysis in parseOnly mode", () => {
      ok("let x = undeclared;", { parseOnly: true })
    })
  })

  describe("analyze-only mode (--analyze)", () => {
    it("returns analyzed AST", () => {
      const result = compile("let x = 1;", { analyzeOnly: true })
      assert.equal(result.kind, "Program")
    })
    it("throws on undeclared variable", () => {
      bad("let x = y;", /Undeclared/, { analyzeOnly: true })
    })
    it("throws on duplicate declaration", () => {
      bad("let x = 1; let x = 2;", /already declared/, { analyzeOnly: true })
    })
    it("throws on const reassignment", () => {
      bad("C x = 1; x = 2;", /constant/, { analyzeOnly: true })
    })
    it("throws on wrong arg count", () => {
      bad("func f(a: inum): inum { deliver a; } f();", /expects/, { analyzeOnly: true })
    })
    it("throws on wrong arg type", () => {
      bad("func f(a: hilo): hilo { deliver a; } f(42);", /mismatch/i, { analyzeOnly: true })
    })
    it("throws on escape outside loop", () => {
      bad("escape;", /loop or hub/, { analyzeOnly: true })
    })
    it("throws on resolve in non-empty function", () => {
      bad("func f(): inum { resolve; }", /resolve/, { analyzeOnly: true })
    })
    it("throws on deliver in empty function", () => {
      bad("func f(): empty { deliver 1; }", /deliver/, { analyzeOnly: true })
    })
    it("throws on bitwise op on non-integer", () => {
      bad("let x = 1.0 bitand 2.0;", /integer/, { analyzeOnly: true })
    })
    it("throws on type mismatch in declaration", () => {
      bad("let x: hilo = 42;", /mismatch/i, { analyzeOnly: true })
    })
  })

  describe("optimize-only mode (--optimize)", () => {
    it("returns optimized AST", () => {
      const result = compile("let x = 1 + 2;", { optimizeOnly: true })
      assert.equal(result.statements[0].initializer.value, 3)
    })
    it("eliminates dead branches", () => {
      const result = compile("is (FF) { let x = 1; }", { optimizeOnly: true })
      const stmt = result.statements[0]
      assert.equal(stmt.kind, "Block")
      assert.equal(stmt.statements.length, 0)
    })
  })

  describe("full generate mode (--generate)", () => {
    it("returns JavaScript string", () => {
      const result = compile("let x = 42;")
      assert.equal(typeof result, "string")
      assert.ok(result.includes("let x = 42"))
    })
    it("generates function declaration", () => {
      const result = js("func add(a: inum, b: inum): inum { deliver a; }")
      assert.ok(result.includes("function add(a, b)"))
      assert.ok(result.includes("return a"))
    })
    it("optimizes constants in full pipeline", () => {
      const result = js("let x = 2 ^ 10;")
      assert.ok(result.includes("1024"))
      assert.ok(!result.includes("**"))
    })
    it("generates if-else correctly", () => {
      const result = js("is (TT) { let x = 1; } not { let y = 2; }")
      assert.ok(result.includes("if (true)") || result.includes("let x = 1"))
    })
    it("generates while loop", () => {
      const result = js("let x = 0; whenis (x < 10) { x += 1; }")
      assert.ok(result.includes("while"))
      assert.ok(result.includes("x += 1"))
    })
    it("generates custom type as Object.freeze", () => {
      const result = js("custom Direction = { North, South, East, West; }")
      assert.ok(result.includes("Object.freeze"))
      assert.ok(result.includes("North"))
    })
    it("generates global as const object", () => {
      const result = js("global config = { maxRetries: 3 };")
      assert.ok(result.includes("const config"))
      assert.ok(result.includes("maxRetries"))
    })
    it("generates exponentiation as **", () => {
      const result = compile("func f(n: inum): inum { deliver n ^ 2; }")
      assert.ok(result.includes("**"))
    })
    it("generates bitwise operators correctly", () => {
      const result = js("func f(a: inum, b: inum): inum { deliver a bitxor b; }")
      assert.ok(result.includes("^"))
    })
    it("generates logical xor as !== comparison", () => {
      const result = js("func f(a: hilo, b: hilo): hilo { deliver a ^| b; }")
      assert.ok(result.includes("!=="))
    })
    it("generates xnor as === comparison", () => {
      const result = js("func f(a: hilo, b: hilo): hilo { deliver a ^& b; }")
      assert.ok(result.includes("==="))
    })
    it("generates hub/switch statement", () => {
      const result = js("let x = 1; hub (x) { :{1}: { let a = 1; } base { let b = 0; } }")
      assert.ok(result.includes("switch"))
      assert.ok(result.includes("case 1:"))
      assert.ok(result.includes("default:"))
    })
  })

  describe("end-to-end integration", () => {
    it("compiles a fibonacci function", () => {
      const src = `
        func fib(n: inum): inum {
          is (n <= 1) {
            deliver n;
          }
          deliver fib(n - 1) + fib(n - 2);
        }
        let result = fib(10);
      `
      const out = js(src)
      assert.ok(out.includes("function fib(n)"))
      assert.ok(out.includes("fib("))
    })
    it("compiles a program with loops and conditions", () => {
      const src = `
        func sumTo(n: inum): inum {
          let total = 0;
          let i = 1;
          whenis (i <= n) {
            total += i;
            i += 1;
          }
          deliver total;
        }
      `
      const out = js(src)
      assert.ok(out.includes("while"))
      assert.ok(out.includes("total += i"))
    })
    it("compiles bit operations", () => {
      const src = `
        func hasBit(x: inum, pos: inum): hilo {
          deliver x{pos};
        }
        let flags = 0;
        flags{2} = TT;
      `
      const out = js(src)
      assert.ok(out.includes("1 << 2"))
      assert.ok(out.includes(">>"))
    })
    it("produces valid-looking JS for complete program", () => {
      const src = `
        custom Status = { Ok(0), Err(1); }
        global cfg = { timeout: 5000 };
        func clamp(val: inum, lo: inum, hi: inum): inum {
          is (val < lo) { deliver lo; }
          is (val > hi) { deliver hi; }
          deliver val;
        }
        let v = clamp(150, 0, 100);
      `
      const out = js(src)
      assert.ok(out.includes("Object.freeze"))
      assert.ok(out.includes("function clamp"))
      assert.ok(out.includes("const cfg"))
    })
  })
})
