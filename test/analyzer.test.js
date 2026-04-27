import assert from "assert/strict"
import { parse } from "../src/parser.js"
import { analyze } from "../src/analyzer.js"
import { ANY, BYTE, DNUM, HILO, INUM, arrayType, customType, isAssignableTo } from "../src/core.js"

function ok(src) {
  assert.doesNotThrow(() => analyze(parse(src)))
}
function bad(src, pattern) {
  assert.throws(() => analyze(parse(src)), pattern)
}

describe("Analyzer", () => {
  describe("declarations", () => {
    it("accepts let declaration", () => ok("let x = 1;"))
    it("accepts const declaration", () => ok("C x = 1;"))
    it("accepts typed let", () => ok("let x: inum = 1;"))
    it("accepts typed const", () => ok("C x: dnum = 3.14;"))
    it("rejects duplicate variable", () => bad("let x = 1; let x = 2;", /already declared/))
    it("accepts same name in different scopes", () =>
      ok("is (TT) { let x = 1; } is (TT) { let x = 2; }"))
    it("rejects type mismatch in declaration", () => bad("let x: hilo = 42;", /mismatch/i))
  })

  describe("constants", () => {
    it("rejects reassignment to const", () => bad("C x = 1; x = 2;", /constant/))
    it("rejects compound assignment to const", () => bad("C x = 1; x += 1;", /constant/))
  })

  describe("undeclared identifiers", () => {
    it("rejects use of undeclared var", () => bad("let x = y;", /Undeclared/))
    it("rejects call to undeclared func", () => bad("foo();", /Undeclared/))
    it("accepts declared var", () => ok("let x = 1; let y = x;"))
  })

  describe("functions", () => {
    it("accepts empty function", () => ok("func f(): empty { resolve; }"))
    it("accepts valued function", () => ok("func f(): inum { deliver 1; }"))
    it("accepts function call with correct args", () =>
      ok("func add(a: inum, b: inum): inum { deliver a; } let x = add(1, 2);"))
    it("rejects wrong arg count", () => bad("func f(a: inum): inum { deliver a; } f();", /expects/))
    it("rejects wrong arg type", () =>
      bad("func f(a: hilo): hilo { deliver a; } f(42);", /mismatch/i))
    it("rejects resolve in valued function", () => bad("func f(): inum { resolve; }", /resolve/))
    it("rejects deliver in empty function", () => bad("func f(): empty { deliver 1; }", /deliver/))
    it("rejects return type mismatch", () => bad("func f(): hilo { deliver 1; }", /mismatch/i))
  })

  describe("resolve/deliver outside function", () => {
    it("rejects resolve at top level", () => bad("resolve;", /outside of function/))
    it("rejects deliver at top level", () => bad("deliver 1;", /outside of function/))
  })

  describe("break / escape", () => {
    it("accepts escape in while", () => ok("whenis (TT) { escape; }"))
    it("accepts escape in hub", () => ok("let x = 1; hub (x) { :{1}: { escape; } }"))
    it("accepts escape in for", () => ok("whento (let i = 0; i < 5; i++) { escape; }"))
    it("rejects escape at top level", () => bad("escape;", /loop or hub/))
    it("rejects escape in if body", () => bad("is (TT) { escape; }", /loop or hub/))
  })

  describe("type checking", () => {
    it("accepts numeric addition", () => ok("let x = 1 + 2;"))
    it("accepts float arithmetic", () => ok("let x = 1.0 + 2.0;"))
    it("accepts ternary expressions", () => ok("let x = (TT) ? 1 : 2;"))
    it("accepts logical xor expressions", () => ok("let x: hilo = TT ^| FF;"))
    it("accepts logical xnor expressions", () => ok("let x: hilo = TT ^& FF;"))
    it("accepts unary logical not", () => ok("let x: hilo = !TT;"))
    it("accepts unary arithmetic negation", () => ok("let x: inum = -5;"))
    it("accepts unary bitnot on integers", () => ok("let x: inum = bitnot 5;"))
    it("rejects bitwise on float", () => bad("let x = 1.0 bitand 2.0;", /integer/))
    it("rejects bitwise on bool", () => bad("let x = TT bitand FF;", /integer/))
    it("accepts bitwise on inum", () =>
      ok("func f(a: inum, b: inum): inum { deliver a bitand b; }"))
    it("accepts comparison produces hilo", () => ok("let x: hilo = 1 < 2;"))
  })

  describe("bit operations", () => {
    it("accepts bit index on integer var", () => ok("func f(x: inum): hilo { deliver x{0}; }"))
    it("rejects bit index on non-integer", () =>
      bad("func f(x: dnum): hilo { deliver x{0}; }", /integer/))
    it("accepts bit set", () => ok("func f(x: inum): empty { x{0} = TT; resolve; }"))
    it("rejects bit set on non-integer", () =>
      bad("func f(x: dnum): empty { x{0} = TT; resolve; }", /integer/))
  })

  describe("custom types", () => {
    it("accepts plain custom type", () => ok("custom Color = { Red, Green, Blue; }"))
    it("rejects duplicate member names", () => bad("custom X = { A, A; }", /Duplicate/))
  })

  describe("hub / switch", () => {
    it("accepts hub with cases", () => ok("let x = 1; hub (x) { :{1}: { let a = 1; } }"))
    it("rejects duplicate case labels", () =>
      bad("let x = 1; hub (x) { :{1}: { } :{1}: { } }", /Duplicate/))
    it("accepts hub with base", () => ok("let x = 1; hub (x) { :{1}: { } base { } }"))
    it("rejects variable as case label", () =>
      bad("let x = 1; let y = 2; hub (x) { :{y}: { } }", /constant/i))
    it("rejects binary expression as case label", () =>
      bad("let x = 1; hub (x) { :{1 + 1}: { } }", /constant/i))
    it("rejects function call as case label", () =>
      bad("func f(): inum { deliver 1; } let x = 1; hub (x) { :{f()}: { } }", /constant/i))
    it("accepts integer literal as case label", () =>
      ok("let x = 1; hub (x) { :{42}: { } }"))
    it("accepts bool literal as case label", () =>
      ok("let x = TT; hub (x) { :{TT}: { } }"))
    it("accepts string literal as case label", () =>
      ok('let x = "hi"; hub (x) { :{"hello"}: { } }'))
  })

  describe("control flow conditions", () => {
    it("accepts hilo condition in if", () => ok("is (TT) { }"))
    it("accepts comparison in while", () => ok("let x = 0; whenis (x < 5) { x += 1; }"))
  })

  describe("widening conversions", () => {
    it("byte is assignable to inum", () => {
      assert.ok(isAssignableTo(BYTE, INUM))
    })
    it("accepts byte in inum function", () => ok("func f(x: inum): inum { deliver x; }"))
    it("byte is assignable to itself", () => {
      assert.ok(isAssignableTo(BYTE, BYTE))
    })
    it("any is assignable to inum", () => {
      assert.ok(isAssignableTo(ANY, INUM))
    })
    it("inum is assignable to any", () => {
      assert.ok(isAssignableTo(INUM, ANY))
    })
    it("hilo widens to dnum", () => {
      assert.ok(isAssignableTo(HILO, DNUM))
    })
  })

  describe("do-while loop", () => {
    it("accepts do-while", () => ok("let x = 0; execute { x += 1; } whenis (x < 5);"))
    it("accepts escape in do-while", () => ok("let x = 0; execute { escape; } whenis (x < 5);"))
  })

  describe("for loop", () => {
    it("accepts for with let init", () => ok("whento (let i = 0; i < 10; i++) { }"))
    it("accepts for with assign init", () => ok("let i = 0; whento (i = 0; i < 5; i++) { }"))
    it("accepts for with pre-decrement", () => ok("whento (let i = 10; i > 0; --i) { }"))
    it("accepts for with compound update", () => ok("whento (let i = 0; i < 10; i += 2) { }"))
    it("rejects pre-increment on constants", () => bad("C i = 0; ++i;", /constant/))
    it("rejects post-decrement on constants", () => bad("C i = 0; i--;", /constant/))
  })

  describe("analyzed node types", () => {
    it("annotates ternary expressions with a type", () => {
      const program = analyze(parse("let x = (TT) ? 1 : 2;"))
      assert.equal(program.statements[0].initializer.type, INUM)
    })

    it("annotates logical binary expressions as hilo", () => {
      const program = analyze(parse("let x = TT && FF;"))
      assert.equal(program.statements[0].initializer.type, HILO)
    })

    it("annotates unary bitnot with the operand type", () => {
      const program = analyze(parse("let x = bitnot 5;"))
      assert.equal(program.statements[0].initializer.type, INUM)
    })

    it("annotates pre-increment expressions with the identifier type", () => {
      const program = analyze(parse("let x = 0; ++x;"))
      assert.equal(program.statements[1].expression.type, INUM)
    })

    it("annotates post-decrement expressions with the identifier type", () => {
      const program = analyze(parse("let x = 0; x--;"))
      assert.equal(program.statements[1].expression.type, INUM)
    })

    it("annotates field expressions as any", () => {
      const program = analyze(parse("global g = { value: 1 }; let x = g.value;"))
      assert.equal(program.statements[1].initializer.type, ANY)
    })

    it("annotates slice expressions as any", () => {
      const program = analyze(parse("let arr = 0; let x = arr[0:5];"))
      assert.equal(program.statements[1].initializer.type, ANY)
    })

    it("annotates index expressions as any", () => {
      const program = analyze(parse("let arr = 0; let x = arr[0];"))
      assert.equal(program.statements[1].initializer.type, ANY)
    })
  })

  describe("core helper factories", () => {
    it("builds custom types", () => {
      assert.deepEqual(customType("Color"), { kind: "custom", name: "Color" })
    })

    it("builds array types", () => {
      assert.deepEqual(arrayType(INUM), { kind: "array", base: INUM })
    })
  })

  describe("check 8: missing return in non-empty function", () => {
    it("rejects empty body in inum function", () =>
      bad("func f(): inum { }", /missing return/i))
    it("rejects body with no deliver", () =>
      bad("func f(): inum { let x = 1; }", /missing return/i))
    it("rejects if-only return (no else)", () =>
      bad("func f(): inum { is (TT) { deliver 1; } }", /missing return/i))
    it("rejects if/else where only one branch returns", () =>
      bad("func f(): inum { is (TT) { deliver 1; } not { let x = 2; } }", /missing return/i))
    it("accepts deliver at end of body", () =>
      ok("func f(): inum { deliver 1; }"))
    it("accepts deliver inside if/else both branches", () =>
      ok("func f(): inum { is (TT) { deliver 1; } not { deliver 2; } }"))
    it("does NOT require return in empty function", () =>
      ok("func f(): empty { }"))
    it("does NOT require return in empty function with resolve", () =>
      ok("func f(): empty { resolve; }"))
    it("accepts deliver after let statement", () =>
      ok("func f(): inum { let x = 1; deliver x; }"))
    it("accepts hub with all cases and base returning", () =>
      ok(`func f(): inum {
      let x = 1;
      hub (x) { :{1}: { deliver 1; } :{2}: { deliver 2; } base { deliver 0; } }
    }`))
    it("rejects hub that has cases returning but no base", () =>
      bad(`func f(): inum {
      let x = 1;
      hub (x) { :{1}: { deliver 1; } }
    }`, /missing return/i))
    it("rejects function with deliver only inside a loop", () =>
      bad("func f(): inum { whenis (TT) { deliver 1; } }", /missing return/i))
    it("rejects hub where base clause does not return", () =>
      bad(`func f(): inum {
    let x = 1;
    hub (x) { :{1}: { deliver 1; } base { let y = 2; } }
  }`, /missing return/i))
  })
})
