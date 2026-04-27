import assert from "assert/strict"
import { parse } from "../src/parser.js"
import { generate } from "../src/generator.js"

function gen(src) {
  return generate(parse(src))
}

describe("Generator", () => {
  describe("literals", () => {
    it("generates integer literal", () => assert.equal(gen("let x = 42;"), "let x = 42"))
    it("generates float literal", () => assert.equal(gen("let x = 3.14;"), "let x = 3.14"))
    it("generates true", () => assert.equal(gen("let x = TT;"), "let x = true"))
    it("generates false", () => assert.equal(gen("let x = FF;"), "let x = false"))
    it("generates null", () => assert.equal(gen("let x = non;"), "let x = null"))
    it("generates string literal", () => assert.equal(gen('let x = "hi";'), 'let x = "hi"'))
    it("generates char literal as JSON string", () =>
      assert.equal(gen("let x = 'a';"), 'let x = "a"'))
  })

  describe("variable declarations", () => {
    it("generates let with let keyword", () => assert.equal(gen("let x = 0;"), "let x = 0"))
    it("generates const declaration", () => assert.equal(gen("C x = 99;"), "const x = 99"))
    it("generates typed let (type is dropped)", () =>
      assert.equal(gen("let x: inum = 0;"), "let x = 0"))
  })

  describe("assignment statements", () => {
    it("generates simple assignment", () => {
      assert.equal(gen("let x = 0; x = 5;"), "let x = 0\nx = 5")
    })
    it("generates compound +=", () => {
      assert.equal(gen("let x = 0; x += 1;"), "let x = 0\nx += 1")
    })
    it("generates compound -=", () => {
      assert.equal(gen("let x = 5; x -= 2;"), "let x = 5\nx -= 2")
    })
    it("generates compound *=", () => {
      assert.equal(gen("let x = 3; x *= 2;"), "let x = 3\nx *= 2")
    })
    it("generates compound /=", () => {
      assert.equal(gen("let x = 6; x /= 2;"), "let x = 6\nx /= 2")
    })
    it("generates bit set TT (sets bit)", () => {
      assert.equal(gen("let x = 0; x{3} = TT;"), "let x = 0\nx = x | (1 << 3)")
    })
    it("generates bit set FF (clears bit)", () => {
      assert.equal(gen("let x = 0; x{3} = FF;"), "let x = 0\nx = x & ~(1 << 3)")
    })
  })

  describe("arithmetic operators", () => {
    it("generates addition with parens", () =>
      assert.equal(gen("let x = 1 + 2;"), "let x = (1 + 2)"))
    it("generates subtraction", () => assert.equal(gen("let x = 5 - 3;"), "let x = (5 - 3)"))
    it("generates multiplication", () => assert.equal(gen("let x = 3 * 4;"), "let x = (3 * 4)"))
    it("generates division", () => assert.equal(gen("let x = 8 / 2;"), "let x = (8 / 2)"))
    it("generates modulo", () => assert.equal(gen("let x = 7 % 3;"), "let x = (7 % 3)"))
    it("generates exponentiation as **", () =>
      assert.equal(gen("let x = 2 ^ 8;"), "let x = (2 ** 8)"))
  })

  describe("comparison operators", () => {
    it("generates <", () => assert.equal(gen("let x = 1 < 2;"), "let x = (1 < 2)"))
    it("generates >", () => assert.equal(gen("let x = 2 > 1;"), "let x = (2 > 1)"))
    it("generates <=", () => assert.equal(gen("let x = 1 <= 1;"), "let x = (1 <= 1)"))
    it("generates >=", () => assert.equal(gen("let x = 2 >= 1;"), "let x = (2 >= 1)"))
    it("generates ==", () => assert.equal(gen("let x = 1 == 1;"), "let x = (1 == 1)"))
    it("generates !=", () => assert.equal(gen("let x = 1 != 2;"), "let x = (1 != 2)"))
  })

  describe("logical operators", () => {
    it("generates &&", () => assert.equal(gen("let x = TT && FF;"), "let x = (true && false)"))
    it("generates ||", () => assert.equal(gen("let x = TT || FF;"), "let x = (true || false)"))
    it("generates logical xor ^|", () => {
      assert.equal(gen("let x = TT ^| FF;"), "let x = (!!(true) !== !!(false))")
    })
    it("generates logical xnor ^&", () => {
      assert.equal(gen("let x = TT ^& FF;"), "let x = (!!(true) === !!(false))")
    })
  })

  describe("bitwise operators", () => {
    it("generates bitand keyword as &", () =>
      assert.equal(gen("let x = 5 bitand 3;"), "let x = (5 & 3)"))
    it("generates bitor keyword as |", () =>
      assert.equal(gen("let x = 5 bitor 3;"), "let x = (5 | 3)"))
    it("generates bitxor keyword as ^", () =>
      assert.equal(gen("let x = 5 bitxor 3;"), "let x = (5 ^ 3)"))
    it("generates shiftl as <<", () => assert.equal(gen("let x = 1 shiftl 2;"), "let x = (1 << 2)"))
    it("generates shiftr as >>", () => assert.equal(gen("let x = 8 shiftr 1;"), "let x = (8 >> 1)"))
    it("generates symbolic & as &", () => assert.equal(gen("let x = 5 & 3;"), "let x = (5 & 3)"))
    it("generates symbolic | as |", () => assert.equal(gen("let x = 5 | 3;"), "let x = (5 | 3)"))
    it("generates bitnot unary as ~", () => assert.equal(gen("let x = bitnot 5;"), "let x = ~(5)"))
  })

  describe("unary operators", () => {
    it("generates logical not", () => assert.equal(gen("let x = !TT;"), "let x = !(true)"))
    it("generates arithmetic negation", () => assert.equal(gen("let x = -5;"), "let x = -(5)"))
    it("generates pre-increment", () => assert.equal(gen("let x = 0; ++x;"), "let x = 0\n++x"))
    it("generates pre-decrement", () => assert.equal(gen("let x = 0; --x;"), "let x = 0\n--x"))
    it("generates post-increment", () => assert.equal(gen("let x = 0; x++;"), "let x = 0\nx++"))
    it("generates post-decrement", () => assert.equal(gen("let x = 0; x--;"), "let x = 0\nx--"))
  })

  describe("ternary", () => {
    it("generates ternary expression", () => {
      assert.equal(gen("let x = (TT) ? 1 : 2;"), "let x = (true ? 1 : 2)")
    })
  })

  describe("function declarations", () => {
    it("generates empty function", () => {
      assert.equal(gen("func f(): empty { resolve; }"), "function f() {\n  return\n}")
    })
    it("generates function with return value", () => {
      assert.equal(gen("func f(a: inum): inum { deliver a; }"), "function f(a) {\n  return a\n}")
    })
    it("generates function with multiple params", () => {
      assert.ok(
        gen("func add(a: inum, b: inum): inum { deliver a; }").includes("function add(a, b)"),
      )
    })
    it("generates break statement", () => {
      assert.ok(gen("whenis (TT) { escape; }").includes("break"))
    })
  })

  describe("function calls", () => {
    it("generates call with no args", () => {
      assert.ok(gen("func f(): empty { resolve; } f();").includes("f()"))
    })
    it("generates call with args", () => {
      assert.ok(
        gen("func add(a: inum, b: inum): inum { deliver a; } let x = add(1, 2);").includes(
          "add(1, 2)",
        ),
      )
    })
  })

  describe("control flow", () => {
    it("generates if statement", () => {
      assert.equal(gen("is (TT) { let x = 1; }"), "if (true) {\n  let x = 1\n}")
    })
    it("generates if-else statement", () => {
      assert.equal(
        gen("is (TT) { let x = 1; } not { let y = 2; }"),
        "if (true) {\n  let x = 1\n} else {\n  let y = 2\n}",
      )
    })
    it("generates while loop", () => {
      assert.equal(gen("whenis (TT) { let x = 1; }"), "while (true) {\n  let x = 1\n}")
    })
    it("generates do-while loop", () => {
      assert.equal(gen("execute { let x = 1; } whenis (TT);"), "do {\n  let x = 1\n} while (true)")
    })
    it("generates for loop with post-increment", () => {
      const out = gen("whento (let i = 0; i < 10; i++) { }")
      assert.ok(out.includes("for (let i = 0; (i < 10); i++)"))
    })
    it("generates for loop with pre-decrement", () => {
      const out = gen("whento (let i = 10; i > 0; --i) { }")
      assert.ok(out.includes("for (let i = 10; (i > 0); --i)"))
    })
    it("generates for loop with compound update", () => {
      const out = gen("whento (let i = 0; i < 20; i += 2) { }")
      assert.ok(out.includes("for (let i = 0; (i < 20); i += 2)"))
    })
  })

  describe("switch / hub", () => {
    it("generates switch with case", () => {
      const out = gen("let x = 1; hub (x) { :{1}: { let a = 1; } }")
      assert.ok(out.includes("switch (x)"))
      assert.ok(out.includes("case 1:"))
      assert.ok(out.includes("break"))
    })
    it("generates switch with default", () => {
      const out = gen("let x = 1; hub (x) { :{1}: { let a = 1; } base { let b = 0; } }")
      assert.ok(out.includes("default:"))
    })
  })

  describe("custom types", () => {
    it("generates plain enum as Object.freeze", () => {
      const out = gen("custom Color = { Red, Green, Blue; }")
      assert.ok(out.includes("const Color = Object.freeze("))
      assert.ok(out.includes("Red: 0"))
      assert.ok(out.includes("Green: 1"))
      assert.ok(out.includes("Blue: 2"))
    })
    it("generates valued enum with literal values", () => {
      const out = gen("custom Status = { Ok(0), Err(2); }")
      assert.ok(out.includes("Ok: 0"))
      assert.ok(out.includes("Err: 2"))
    })
  })

  describe("global declarations", () => {
    it("generates global as const object", () => {
      const out = gen('global cfg = { x: 1, y: "hi" };')
      assert.ok(out.includes("const cfg = {"))
      assert.ok(out.includes("x: 1"))
      assert.ok(out.includes('y: "hi"'))
    })
  })

  describe("member access expressions", () => {
    it("generates field access", () => {
      const out = gen("let g = 0; let v = g.field;")
      assert.ok(out.includes("g.field"))
    })
    it("generates bit index read as shift+mask", () => {
      const out = gen("let x = 0; let b = x{3};")
      assert.ok(out.includes("((x >> 3) & 1)"))
    })
    it("generates array index", () => {
      const out = gen("let arr = 0; let v = arr[2];")
      assert.ok(out.includes("arr[2]"))
    })
    it("generates array slice", () => {
      const out = gen("let arr = 0; let s = arr[1:4];")
      assert.ok(out.includes("arr.slice(1, 4)"))
    })
  })

  describe("multi-statement programs", () => {
    it("joins statements with newline", () => {
      const out = gen("let x = 1; let y = 2; let z = 3;")
      assert.equal(out, "let x = 1\nlet y = 2\nlet z = 3")
    })
  })

  describe("PostIncDec on non-identifier expression", () => {
    it("generates post-increment on call result", () => {
      const out = gen("func f(): inum { deliver 0; } f()++;")
      assert.ok(out.includes("f()++"))
    })
    it("generates post-decrement on call result", () => {
      const out = gen("func f(): inum { deliver 0; } f()--;")
      assert.ok(out.includes("f()--"))
    })
  })
})
