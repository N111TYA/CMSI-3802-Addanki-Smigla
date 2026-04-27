<p align="center">
  <img src="docs/images/Logo.webp" alt="Forge Logo" width="250"/>
</p>

<h1 align="center">Forge</h1>

<p align="center"><strong><a href="https://N111TYA.github.io/Forge/">Companion Website</a></strong> · <strong><a href="https://github.com/N111TYA/Forge">GitHub Repository</a></strong></p>

<p align="center">
  A statically-typed, JavaScript-targeting programming language with expressive control flow and intuitive bit manipulation.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/tests-349%20passing-brightgreen" alt="Tests"/>
  <img src="https://img.shields.io/badge/coverage-99.8%25-brightgreen" alt="Coverage"/>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License"/>
</p>

---

## The Story

Forge was built as a language that reads like intent. Where other languages bolt on features, Forge starts from the question: _what should code say?_ Returns are either `resolve` (nothing to give back) or `deliver` (here is the result). Loops come in three forms — `whenis`, `execute/whenis`, and `whento` — each chosen for what it communicates about the iteration pattern. Bit manipulation is first-class: index individual bits with `x{n}`, set them with `x{n} = TT`, and clear them with `x{n} = FF`. The type system is explicit at function boundaries and inferred everywhere else. Forge compiles to clean JavaScript so your programs run anywhere.

**Authors:** Nitya Addanki · Tessa Smigla  
**Course:** CMSI 3802 — Languages and Automata II

---

## Features

- **Statically typed** — explicit function signatures, inferred local variables
- **Expressive returns** — `resolve` for void returns, `deliver` for value returns
- **Structured control flow** — `is`/`not` (if/else), `whenis` (while), `execute`/`whenis` (do-while), `whento` (for)
- **Switch with `hub`** — pattern matching via `:{val}:` cases and `base` default
- **First-class bit ops** — `bitand`, `bitor`, `bitxor`, `bitnot`, `shiftl`, `shiftr` and symbolic `&` / `|`
- **Bit indexing** — read `x{n}`, set `x{n} = TT`, clear `x{n} = FF`
- **Custom enum types** — `custom Direction = { North, South, East, West; }`
- **Global objects** — `global config = { timeout: 5000 };`
- **Boolean literals** — `TT` (true) and `FF` (false)
- **Null literal** — `non`
- **Immutable constants** — `C PI = 3.14;`
- **Logical XOR / XNOR** — `^|` and `^&`
- **Exponentiation** — `2 ^ 10`
- **Widening type conversions** — `byte → snum → inum → lnum → fnum → dnum`
- **Optimizer** — constant folding, dead branch elimination, identity simplification
- **Compiles to JavaScript** — readable output, no runtime needed

---

## Types

| Forge Type | Meaning                |
| ---------- | ---------------------- |
| `byte`     | Small integer          |
| `char`     | Single character       |
| `snum`     | Short integer          |
| `inum`     | Standard integer       |
| `lnum`     | Long integer           |
| `fnum`     | Single-precision float |
| `dnum`     | Double-precision float |
| `hilo`     | Boolean (`TT` / `FF`)  |
| `empty`    | Void / no return value |

---

## Static Checks

Forge's analyzer enforces the following at compile time:

1. Undeclared identifier use → **error**
2. Duplicate declarations in same scope → **error**
3. Assignment to a constant (`C`) → **error**
4. `resolve` in a non-`empty` function → **error**
5. `deliver` in an `empty` function → **error**
6. `escape` outside a loop or `hub` → **error**
7. Wrong argument count in function call → **error**
8. Wrong argument type in function call → **error**
9. Incompatible types in assignment → **error**
10. Invalid operator/type combination (e.g. `+` on booleans) → **error**
11. Duplicate case labels in `hub` → **error**
12. Bitwise operations on non-integer types → **error**
13. `resolve`/`deliver` outside any function → **error**
14. Bit index or bit set on non-integer variable → **error**
15. Const reassignment via `+=`, `-=`, `*=`, `/=` → **error**
16. Const modification via `++` / `--` → **error**

---

## Example Programs

### Functions and Recursion

```forge
func factorial(n: inum): inum {
  is (n <= 1) {
    deliver 1;
  }
  deliver n * factorial(n - 1);
}

func max(a: inum, b: inum): inum {
  is (a > b) { deliver a; }
  deliver b;
}

let result = factorial(5);
let biggest = max(42, 17);
```

### Loops and Arithmetic

```forge
func sumTo(n: inum): inum {
  let total = 0;
  let i = 1;
  whenis (i <= n) {
    total += i;
    i += 1;
  }
  deliver total;
}

func gcd(a: inum, b: inum): inum {
  whenis (b != 0) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  deliver a;
}
```

### Bit Operations

```forge
func testBit(x: inum, pos: inum): hilo {
  deliver x{pos};
}

func countBits(x: inum): inum {
  let count = 0;
  let n = x;
  whenis (n != 0) {
    count += n & 1;
    n = n shiftr 1;
  }
  deliver count;
}

let flags = 0;
flags{0} = TT;
flags{2} = TT;
flags{2} = FF;
```

### Custom Types and Switch

```forge
custom Direction = { North, South, East, West; }
custom Status    = { Ok(0), Warn(1), Err(2); }

func describe(d: inum): inum {
  hub (d) {
    :{0}: { deliver Direction.North; }
    :{1}: { deliver Direction.South; }
    base  { deliver -1; }
  }
}
```

### Globals and Field Access

```forge
global config = {
  maxRetries: 3,
  timeout: 5000,
  version: 1
};

func clamp(val: inum, lo: inum, hi: inum): inum {
  is (val < lo) { deliver lo; }
  is (val > hi) { deliver hi; }
  deliver val;
}

let retries = config.maxRetries;
let v = clamp(150, 0, 100);
```

---

## Generated JavaScript

Given this Forge program:

```forge
func factorial(n: inum): inum {
  is (n <= 1) {
    deliver 1;
  }
  deliver n * factorial(n - 1);
}

func isEven(n: inum): hilo {
  deliver (n % 2) == 0;
}

let result = factorial(5);
let check = isEven(result);
```

Forge compiles it to:

```js
function factorial(n) {
  if (n <= 1) {
    return 1
  }
  return n * factorial(n - 1)
}
function isEven(n) {
  return n % 2 == 0
}
let result = factorial(5)
let check = isEven(result)
```

---

## Setup

**Requirements:** Node.js 18+

```bash
git clone https://github.com/N111TYA/Forge
cd Forge
npm install
```

---

## Running the Compiler

```bash
node src/forge.js --check    <file.forge>   # syntax check only
node src/forge.js --parse    <file.forge>   # parse and print AST
node src/forge.js --analyze  <file.forge>   # analyze and print annotated AST
node src/forge.js --optimize <file.forge>   # optimize and print AST
node src/forge.js --generate <file.forge>   # compile to JavaScript
```

Example:

```bash
node src/forge.js --generate examples/math.forge
```

---

## Testing

```bash
npm test
```

Runs 349 tests with coverage via [c8](https://github.com/bcoe/c8) and [Mocha](https://mochajs.org/).

Current coverage: **99.8% statements · 96.89% branches · 96.72% functions**

---

## Project Structure

```
src/
  forge.js       CLI entry point
  forge.ohm      Ohm.js grammar
  parser.js      Parse tree → AST
  core.js        AST node factories and types
  analyzer.js    Static analysis (16 checks)
  optimizer.js   Constant folding and dead code elimination
  generator.js   AST → JavaScript
  compiler.js    Pipeline orchestrator
test/
  parser.test.js
  analyzer.test.js
  optimizer.test.js
  generator.test.js
  compiler.test.js
examples/
  hello.forge    Functions, if/else, recursion
  math.forge     Loops, for, GCD
  bitops.forge   Bit operations and indexing
  enum.forge     Custom types and hub/switch
  globals.forge  Global objects and field access
```

---

## License

MIT © Nitya Addanki, Tessa Smigla
