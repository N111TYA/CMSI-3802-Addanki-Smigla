import assert from "assert/strict"
import { parse } from "../src/parser.js"
import { optimize } from "../src/optimizer.js"
import { generate } from "../src/generator.js"

function optAst(src) {
  return optimize(parse(src))
}

function opt(src) {
  return generate(optimize(parse(src)))
}

describe("Optimizer", () => {
  describe("constant folding — arithmetic", () => {
    it("folds integer addition", () => {
      const p = optAst("let x = 1 + 2;")
      assert.equal(p.statements[0].initializer.kind, "IntLit")
      assert.equal(p.statements[0].initializer.value, 3)
    })
    it("folds integer subtraction", () => {
      const p = optAst("let x = 5 - 3;")
      assert.equal(p.statements[0].initializer.value, 2)
    })
    it("folds integer multiplication", () => {
      const p = optAst("let x = 3 * 4;")
      assert.equal(p.statements[0].initializer.value, 12)
    })
    it("folds integer division", () => {
      const p = optAst("let x = 10 / 2;")
      assert.equal(p.statements[0].initializer.value, 5)
    })
    it("folds modulo", () => {
      const p = optAst("let x = 10 % 3;")
      assert.equal(p.statements[0].initializer.value, 1)
    })
    it("folds exponentiation", () => {
      const p = optAst("let x = 2 ^ 8;")
      assert.equal(p.statements[0].initializer.value, 256)
    })
    it("does not fold division by zero", () => {
      const p = optAst("let x = 5 / 0;")
      assert.equal(p.statements[0].initializer.kind, "BinaryExp")
    })
    it("does not fold modulo by zero", () => {
      const p = optAst("let x = 5 % 0;")
      assert.equal(p.statements[0].initializer.kind, "BinaryExp")
    })
    it("generates folded value correctly", () => {
      assert.equal(opt("let x = 1 + 2;"), "let x = 3")
    })
  })

  describe("constant folding — comparison", () => {
    it("folds 1 < 2 to true", () => {
      const p = optAst("let x = 1 < 2;")
      assert.equal(p.statements[0].initializer.kind, "BoolLit")
      assert.equal(p.statements[0].initializer.value, true)
    })
    it("folds 2 < 1 to false", () => {
      const p = optAst("let x = 2 < 1;")
      assert.equal(p.statements[0].initializer.value, false)
    })
    it("folds 1 == 1 to true", () => {
      const p = optAst("let x = 1 == 1;")
      assert.equal(p.statements[0].initializer.value, true)
    })
    it("folds 1 != 2 to true", () => {
      const p = optAst("let x = 1 != 2;")
      assert.equal(p.statements[0].initializer.value, true)
    })
    it("folds 3 >= 3 to true", () => {
      const p = optAst("let x = 3 >= 3;")
      assert.equal(p.statements[0].initializer.value, true)
    })
    it("folds 5 > 3 to true", () => {
      const p = optAst("let x = 5 > 3;")
      assert.equal(p.statements[0].initializer.value, true)
    })
    it("folds 2 <= 1 to false", () => {
      const p = optAst("let x = 2 <= 1;")
      assert.equal(p.statements[0].initializer.value, false)
    })
  })

  describe("constant folding — logical", () => {
    it("folds TT && TT to true", () => {
      assert.equal(opt("let x = TT && TT;"), "let x = true")
    })
    it("folds FF || TT to true", () => {
      assert.equal(opt("let x = FF || TT;"), "let x = true")
    })
    it("folds TT ^| FF to true (xor)", () => {
      assert.equal(opt("let x = TT ^| FF;"), "let x = true")
    })
    it("folds TT ^& TT to true (xnor)", () => {
      assert.equal(opt("let x = TT ^& TT;"), "let x = true")
    })
  })

  describe("constant folding — bitwise", () => {
    it("folds 5 bitand 3 to 1", () => {
      const p = optAst("let x = 5 bitand 3;")
      assert.equal(p.statements[0].initializer.value, 1)
    })
    it("folds 5 bitor 3 to 7", () => {
      const p = optAst("let x = 5 bitor 3;")
      assert.equal(p.statements[0].initializer.value, 7)
    })
    it("folds 5 bitxor 3 to 6", () => {
      const p = optAst("let x = 5 bitxor 3;")
      assert.equal(p.statements[0].initializer.value, 6)
    })
    it("folds 1 shiftl 3 to 8", () => {
      const p = optAst("let x = 1 shiftl 3;")
      assert.equal(p.statements[0].initializer.value, 8)
    })
    it("folds 8 shiftr 2 to 2", () => {
      const p = optAst("let x = 8 shiftr 2;")
      assert.equal(p.statements[0].initializer.value, 2)
    })
  })

  describe("unary folding", () => {
    it("folds -5 to IntLit(-5)", () => {
      const p = optAst("let x = -5;")
      assert.equal(p.statements[0].initializer.kind, "IntLit")
      assert.equal(p.statements[0].initializer.value, -5)
    })
    it("folds -3.14 to FloatLit(-3.14)", () => {
      const p = optAst("let x = -3.14;")
      assert.equal(p.statements[0].initializer.kind, "FloatLit")
      assert.ok(Math.abs(p.statements[0].initializer.value + 3.14) < 0.001)
    })
    it("folds !TT to false", () => {
      const p = optAst("let x = !TT;")
      assert.equal(p.statements[0].initializer.kind, "BoolLit")
      assert.equal(p.statements[0].initializer.value, false)
    })
    it("folds !FF to true", () => {
      const p = optAst("let x = !FF;")
      assert.equal(p.statements[0].initializer.value, true)
    })
    it("does not fold bitnot (not a literal operation)", () => {
      const p = optAst("let x = bitnot 5;")
      assert.equal(p.statements[0].initializer.kind, "UnaryExp")
    })
  })

  describe("identity simplifications", () => {
    it("x + 0 → x", () => {
      const p = optAst("let n = 0; let x = n + 0;")
      assert.equal(p.statements[1].initializer.kind, "IdExp")
    })
    it("0 + x → x", () => {
      const p = optAst("let n = 0; let x = 0 + n;")
      assert.equal(p.statements[1].initializer.kind, "IdExp")
    })
    it("x - 0 → x", () => {
      const p = optAst("let n = 5; let x = n - 0;")
      assert.equal(p.statements[1].initializer.kind, "IdExp")
    })
    it("x * 1 → x", () => {
      const p = optAst("let n = 5; let x = n * 1;")
      assert.equal(p.statements[1].initializer.kind, "IdExp")
    })
    it("1 * x → x", () => {
      const p = optAst("let n = 5; let x = 1 * n;")
      assert.equal(p.statements[1].initializer.kind, "IdExp")
    })
    it("x * 0 → IntLit(0)", () => {
      const p = optAst("let n = 5; let x = n * 0;")
      assert.equal(p.statements[1].initializer.kind, "IntLit")
      assert.equal(p.statements[1].initializer.value, 0)
    })
    it("0 * x → IntLit(0)", () => {
      const p = optAst("let n = 5; let x = 0 * n;")
      assert.equal(p.statements[1].initializer.kind, "IntLit")
      assert.equal(p.statements[1].initializer.value, 0)
    })
    it("x ^ 1 → x", () => {
      const p = optAst("let n = 5; let x = n ^ 1;")
      assert.equal(p.statements[1].initializer.kind, "IdExp")
    })
    it("x ^ 0 → IntLit(1)", () => {
      const p = optAst("let n = 5; let x = n ^ 0;")
      assert.equal(p.statements[1].initializer.kind, "IntLit")
      assert.equal(p.statements[1].initializer.value, 1)
    })
  })

  describe("dead branch elimination — if", () => {
    it("is(TT) inlines consequent, removes IfStmt", () => {
      const p = optAst("is (TT) { let x = 1; }")
      assert.equal(p.statements[0].kind, "Block")
    })
    it("is(FF) with alternate inlines alternate", () => {
      const p = optAst("is (FF) { let x = 1; } not { let y = 2; }")
      assert.equal(p.statements[0].kind, "Block")
      assert.equal(p.statements[0].statements[0].name, "y")
    })
    it("is(FF) with no alternate returns empty block", () => {
      const p = optAst("is (FF) { let x = 1; }")
      assert.equal(p.statements[0].kind, "Block")
      assert.equal(p.statements[0].statements.length, 0)
    })
    it("generated output of is(TT) includes body content", () => {
      assert.ok(opt("is (TT) { let x = 1; }").includes("let x = 1"))
    })
    it("generated output of is(FF) is empty", () => {
      assert.equal(opt("is (FF) { let x = 1; }").trim(), "")
    })
  })

  describe("dead branch elimination — while", () => {
    it("whenis(FF) returns empty block", () => {
      const p = optAst("whenis (FF) { let x = 1; }")
      assert.equal(p.statements[0].kind, "Block")
      assert.equal(p.statements[0].statements.length, 0)
    })
    it("whenis(TT) keeps while loop", () => {
      const p = optAst("whenis (TT) { let x = 1; }")
      assert.equal(p.statements[0].kind, "WhileStmt")
    })
    it("generated output of whenis(FF) is empty", () => {
      assert.equal(opt("whenis (FF) { let x = 1; }").trim(), "")
    })
  })

  describe("ternary folding", () => {
    it("(TT) ? 1 : 2 → 1", () => {
      const p = optAst("let x = (TT) ? 1 : 2;")
      assert.equal(p.statements[0].initializer.kind, "IntLit")
      assert.equal(p.statements[0].initializer.value, 1)
    })
    it("(FF) ? 1 : 2 → 2", () => {
      const p = optAst("let x = (FF) ? 1 : 2;")
      assert.equal(p.statements[0].initializer.kind, "IntLit")
      assert.equal(p.statements[0].initializer.value, 2)
    })
    it("non-literal ternary is kept", () => {
      const p = optAst("let b = TT; let x = (b) ? 1 : 2;")
      assert.equal(p.statements[1].initializer.kind, "Ternary")
    })
  })

  describe("dead code after return/break", () => {
    it("removes statements after resolve in function body", () => {
      const p = optAst("func f(): empty { resolve; let dead = 1; }")
      const body = p.statements[0].body
      assert.equal(body.statements.length, 1)
      assert.equal(body.statements[0].kind, "ReturnStmt")
    })
    it("removes statements after deliver in function body", () => {
      const p = optAst("func f(): inum { deliver 1; let dead = 2; }")
      const body = p.statements[0].body
      assert.equal(body.statements.length, 1)
    })
    it("removes statements after escape in while body", () => {
      const p = optAst("whenis (TT) { escape; let dead = 1; }")
      const body = p.statements[0].body
      assert.equal(body.statements.length, 1)
      assert.equal(body.statements[0].kind, "BreakStmt")
    })
    it("generated function body omits dead code after return", () => {
      const out = opt("func f(): inum { deliver 1; let dead = 2; }")
      assert.ok(!out.includes("dead"))
    })
  })

  describe("optimization inside function bodies", () => {
    it("folds constants inside function bodies", () => {
      const out = opt("func f(): inum { deliver 1 + 1; }")
      assert.ok(out.includes("return 2"))
    })
    it("applies identity simplification inside functions", () => {
      const out = opt("func f(n: inum): inum { deliver n * 1; }")
      assert.ok(!out.includes("* 1"))
    })
  })

  describe("optimization of other statement types", () => {
    it("optimizes VarDecl initializer", () => {
      assert.equal(opt("let x = 2 * 3;"), "let x = 6")
    })
    it("optimizes AssignStmt value", () => {
      const out = opt("let x = 0; x = 4 + 4;")
      assert.ok(out.includes("x = 8"))
    })
    it("optimizes CompoundAssignStmt value", () => {
      const out = opt("let x = 0; x += 2 + 2;")
      assert.ok(out.includes("x += 4"))
    })
    it("optimizes ReturnStmt expression", () => {
      const out = opt("func f(): inum { deliver 5 * 5; }")
      assert.ok(out.includes("return 25"))
    })
    it("optimizes ForStmt body", () => {
      const p = optAst("whento (let i = 0; i < 10; i++) { let x = 1 + 1; }")
      assert.equal(p.statements[0].body.statements[0].initializer.value, 2)
    })
    it("optimizes DoWhileStmt body", () => {
      const p = optAst("let x = 0; execute { x += 1; } whenis (TT);")
      assert.equal(p.statements[1].kind, "DoWhileStmt")
    })
    it("optimizes SwitchStmt case bodies", () => {
      const p = optAst("let x = 1; hub (x) { :{1}: { let a = 1 + 1; } }")
      const caseBody = p.statements[1].cases[0].body
      assert.equal(caseBody.statements[0].initializer.value, 2)
    })
    it("optimizes args in CallExp", () => {
      const p = optAst("func f(n: inum): inum { deliver n; } let x = f(2 + 2);")
      const call = p.statements[1].initializer
      assert.equal(call.args[0].value, 4)
    })
    it("passes through CustomDecl unchanged", () => {
      const p = optAst("custom Color = { Red, Green, Blue; }")
      assert.equal(p.statements[0].kind, "CustomDecl")
    })
    it("passes through GlobalDecl unchanged", () => {
      const p = optAst("global g = { x: 1 };")
      assert.equal(p.statements[0].kind, "GlobalDecl")
    })
    it("passes through BitSetStmt unchanged", () => {
      const p = optAst("let x = 0; x{3} = TT;")
      assert.equal(p.statements[1].kind, "BitSetStmt")
    })
  })

  describe("float folding (makeLit float path)", () => {
    it("folds float division to FloatLit", () => {
      const p = optAst("let x = 5.0 / 2.0;")
      assert.equal(p.statements[0].initializer.kind, "FloatLit")
      assert.ok(Math.abs(p.statements[0].initializer.value - 2.5) < 0.001)
    })
    it("folds mixed numeric ops to float", () => {
      const p = optAst("let x = 1.0 + 0.5;")
      assert.equal(p.statements[0].initializer.kind, "FloatLit")
    })
  })

  describe("optBlock inlining (IfStmt folded inside function)", () => {
    it("inlines true-branch if block inside function", () => {
      const out = opt("func f(): inum { is (TT) { deliver 1; } deliver 2; }")
      assert.ok(out.includes("return 1"))
    })
    it("inlines false-branch if-else block inside function body", () => {
      const out = opt("func f(): inum { is (FF) { deliver 1; } not { deliver 2; } deliver 0; }")
      assert.ok(out.includes("return 2"))
    })
  })

  describe("expression pass-throughs", () => {
    it("passes through StringLit unchanged", () => {
      const p = optAst('let x = "hello";')
      assert.equal(p.statements[0].initializer.kind, "StringLit")
    })
    it("passes through CharLit unchanged", () => {
      const p = optAst("let x = 'a';")
      assert.equal(p.statements[0].initializer.kind, "CharLit")
    })
    it("passes through NullLit unchanged", () => {
      const p = optAst("let x = non;")
      assert.equal(p.statements[0].initializer.kind, "NullLit")
    })
    it("passes through BitIndexExp with optimized index", () => {
      const p = optAst("let n = 0; let b = n{1 + 1};")
      assert.equal(p.statements[1].initializer.kind, "BitIndexExp")
      assert.equal(p.statements[1].initializer.index.value, 2)
    })
    it("passes through IndexExp with optimized index", () => {
      const p = optAst("let arr = 0; let v = arr[1 + 1];")
      assert.equal(p.statements[1].initializer.kind, "IndexExp")
      assert.equal(p.statements[1].initializer.index.value, 2)
    })
    it("passes through SliceExp with optimized bounds", () => {
      const p = optAst("let arr = 0; let s = arr[1 + 1:2 + 3];")
      assert.equal(p.statements[1].initializer.kind, "SliceExp")
      assert.equal(p.statements[1].initializer.start.value, 2)
      assert.equal(p.statements[1].initializer.end.value, 5)
    })
    it("passes through FieldExp with optimized object", () => {
      const p = optAst("global g = { x: 1 }; let v = g.x;")
      assert.equal(p.statements[1].initializer.kind, "FieldExp")
    })
    it("passes through PreIncDec unchanged", () => {
      const p = optAst("let x = 0; ++x;")
      assert.equal(p.statements[1].expression.kind, "PreIncDec")
    })
    it("passes through PostIncDec unchanged", () => {
      const p = optAst("let x = 0; x++;")
      assert.equal(p.statements[1].expression.kind, "PostIncDec")
    })
    it("passes through IdExp unchanged", () => {
      const p = optAst("let n = 5; let x = n;")
      assert.equal(p.statements[1].initializer.kind, "IdExp")
    })
  })
})
