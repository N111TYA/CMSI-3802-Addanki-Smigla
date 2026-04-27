import assert from "assert/strict"
import { parse } from "../src/parser.js"

function ok(src) {
  assert.doesNotThrow(() => parse(src))
}
function bad(src) {
  assert.throws(() => parse(src))
}

describe("Parser", () => {
  describe("literals", () => {
    it("parses integer literal", () => ok("let x = 42;"))
    it("parses float literal", () => ok("let x = 3.14;"))
    it("parses bool true", () => ok("let x = TT;"))
    it("parses bool false", () => ok("let x = FF;"))
    it("parses null", () => ok("let x = non;"))
    it("parses string literal", () => ok('let x = "hello";'))
    it("parses char literal", () => ok("let x = 'a';"))
    it("parses escape in string", () => ok('let x = "line\\nbreak";'))
  })

  describe("variable declarations", () => {
    it("parses let inferred", () => ok("let x = 1;"))
    it("parses let typed", () => ok("let x: inum = 1;"))
    it("parses const inferred", () => ok("C x = 1;"))
    it("parses const typed", () => ok("C x: dnum = 3.14;"))
  })

  describe("assignment", () => {
    it("parses simple assignment", () => ok("let x = 0; x = 5;"))
    it("parses compound +=", () => ok("let x = 0; x += 1;"))
    it("parses compound -=", () => ok("let x = 0; x -= 1;"))
    it("parses compound *=", () => ok("let x = 1; x *= 2;"))
    it("parses compound /=", () => ok("let x = 4; x /= 2;"))
    it("parses bit set TT", () => ok("let x = 0; x{3} = TT;"))
    it("parses bit set FF", () => ok("let x = 0; x{3} = FF;"))
  })

  describe("functions", () => {
    it("parses no-param function", () => ok("func f(): empty { resolve; }"))
    it("parses function with params", () => ok("func add(a: inum, b: inum): inum { deliver a; }"))
    it("parses function call", () => ok("func f(): empty { resolve; } f();"))
    it("parses function with all types", () => {
      ok(
        "func f(a: byte, b: char, c: snum, d: lnum, e: fnum, g: dnum, h: hilo): empty { resolve; }",
      )
    })
  })

  describe("return statements", () => {
    it("parses resolve", () => ok("func f(): empty { resolve; }"))
    it("parses deliver", () => ok("func f(): inum { deliver 1; }"))
  })

  describe("control flow", () => {
    it("parses if", () => ok("is (TT) { let x = 1; }"))
    it("parses if-not", () => ok("is (TT) { let x = 1; } not { let x = 2; }"))
    it("parses while", () => ok("let x = 0; whenis (x < 10) { x += 1; }"))
    it("parses do-while", () => ok("let x = 0; execute { x += 1; } whenis (x < 5);"))
    it("parses for with let init", () => ok("whento (let i = 0; i < 10; i++) { }"))
    it("parses for with assign init", () => ok("let i = 0; whento (i = 0; i < 5; i++) { }"))
    it("parses for with predec update", () => ok("whento (let i = 10; i > 0; --i) { }"))
    it("parses break", () => ok("whenis (TT) { escape; }"))
    it("parses nested if", () => ok("is (TT) { is (FF) { let x = 1; } }"))
  })

  describe("switch / hub", () => {
    it("parses hub with cases", () =>
      ok("let x = 1; hub (x) { :{1}: { let a = 1; } :{2}: { let b = 2; } }"))
    it("parses hub with base", () =>
      ok("let x = 1; hub (x) { :{1}: { let a = 1; } base { let b = 0; } }"))
    it("parses hub with no cases", () => ok("let x = 1; hub (x) { base { let b = 0; } }"))
    it("rejects duplicate base clauses (grammar enforcement)", () =>
      bad("let x = 1; hub (x) { base { } base { } }"))
  })

  describe("expressions", () => {
    it("parses arithmetic", () => ok("let x = 1 + 2 * 3 - 4 / 2;"))
    it("parses modulo", () => ok("let x = 10 % 3;"))
    it("parses exponent", () => ok("let x = 2 ^ 8;"))
    it("parses unary neg", () => ok("let x = -5;"))
    it("parses unary not", () => ok("let x = !TT;"))
    it("parses comparison", () => ok("let x = 1 < 2;"))
    it("parses equality", () => ok("let x = 1 == 1;"))
    it("parses logical and", () => ok("let x = TT && FF;"))
    it("parses logical or", () => ok("let x = TT || FF;"))
    it("parses logical xor", () => ok("let x = TT ^| FF;"))
    it("parses logical xnor", () => ok("let x = TT ^& FF;"))
    it("parses ternary", () => ok("let x = (TT) ? 1 : 2;"))
    it("parses parenthesized expr", () => ok("let x = (1 + 2) * 3;"))
    it("parses bitwise and", () => ok("let x = 5 & 3;"))
    it("parses bitwise or", () => ok("let x = 5 | 3;"))
    it("parses bitand keyword", () => ok("let x = 5 bitand 3;"))
    it("parses bitor keyword", () => ok("let x = 5 bitor 3;"))
    it("parses bitxor keyword", () => ok("let x = 5 bitxor 3;"))
    it("parses shiftl", () => ok("let x = 1 shiftl 2;"))
    it("parses shiftr", () => ok("let x = 8 shiftr 1;"))
    it("parses bitnot", () => ok("let x = bitnot 5;"))
    it("parses pre-increment", () => ok("let x = 0; ++x;"))
    it("parses post-increment", () => ok("let x = 0; x++;"))
    it("parses pre-decrement", () => ok("let x = 0; --x;"))
    it("parses post-decrement", () => ok("let x = 0; x--;"))
    it("parses index access", () => ok("let arr = 0; let x = arr[0];"))
    it("parses slice access", () => ok("let arr = 0; let x = arr[0:5];"))
    it("parses bit index read", () => ok("let x = 0; let b = x{3};"))
    it("parses field access", () => ok("let g = 0; let v = g.field;"))
  })

  describe("custom types", () => {
    it("parses plain custom type", () => ok("custom Color = { Red, Green, Blue; }"))
    it("parses valued custom type", () =>
      ok('custom Token = { Pi(3.14), Count(21), Label("hi"); }'))
    it("parses bool-valued custom type", () => ok("custom Flag = { On(TT), Off(FF); }"))
  })

  describe("globals", () => {
    it("parses global declaration", () => ok('global g = { x: 1, y: "hi" };'))
  })

  describe("comments", () => {
    it("parses line comment", () => ok("// this is a comment\nlet x = 1;"))
    it("parses block comment", () => ok("/* block */ let x = 1;"))
    it("parses inline comment", () => ok("let x = 1; // comment"))
  })

  describe("AST shape", () => {
    it("returns Program node", () => {
      const ast = parse("let x = 1;")
      assert.equal(ast.kind, "Program")
      assert.equal(ast.statements.length, 1)
    })
    it("VarDecl has correct fields", () => {
      const ast = parse("let x = 42;")
      const d = ast.statements[0]
      assert.equal(d.kind, "VarDecl")
      assert.equal(d.name, "x")
      assert.equal(d.readOnly, false)
      assert.equal(d.initializer.kind, "IntLit")
      assert.equal(d.initializer.value, 42)
    })
    it("FuncDecl has correct fields", () => {
      const ast = parse("func add(a: inum, b: inum): inum { deliver a; }")
      const f = ast.statements[0]
      assert.equal(f.kind, "FuncDecl")
      assert.equal(f.name, "add")
      assert.equal(f.params.length, 2)
      assert.equal(f.params[0].name, "a")
    })
    it("ConstDecl sets readOnly true", () => {
      const ast = parse("C x = 1;")
      const d = ast.statements[0]
      assert.equal(d.kind, "VarDecl")
      assert.equal(d.readOnly, true)
    })
    it("BoolLit TT has value true", () => {
      const ast = parse("let x = TT;")
      assert.equal(ast.statements[0].initializer.value, true)
    })
    it("BoolLit FF has value false", () => {
      const ast = parse("let x = FF;")
      assert.equal(ast.statements[0].initializer.value, false)
    })
    it("FloatLit has correct value", () => {
      const ast = parse("let x = 3.14;")
      assert.equal(ast.statements[0].initializer.kind, "FloatLit")
      assert.ok(Math.abs(ast.statements[0].initializer.value - 3.14) < 0.0001)
    })
    it("NullLit is correct kind", () => {
      const ast = parse("let x = non;")
      assert.equal(ast.statements[0].initializer.kind, "NullLit")
    })
    it("for post-decrement update becomes PostIncDec", () => {
      const ast = parse("whento (let i = 10; i > 0; i--) { }")
      assert.equal(ast.statements[0].update.kind, "PostIncDec")
      assert.equal(ast.statements[0].update.op, "--")
    })
    it("for pre-increment update becomes PreIncDec", () => {
      const ast = parse("whento (let i = 0; i < 10; ++i) { }")
      assert.equal(ast.statements[0].update.kind, "PreIncDec")
      assert.equal(ast.statements[0].update.op, "++")
    })
    it("for compound update becomes CompoundAssignStmt", () => {
      const ast = parse("whento (let i = 0; i < 10; i += 2) { }")
      assert.equal(ast.statements[0].update.kind, "CompoundAssignStmt")
      assert.equal(ast.statements[0].update.op, "+=")
    })
  })

  describe("syntax errors", () => {
    it("rejects missing semicolon", () => bad("let x = 1"))
    it("rejects bad token", () => bad("@"))
    it("rejects unclosed block", () => bad("func f(): empty {"))
  })
})
