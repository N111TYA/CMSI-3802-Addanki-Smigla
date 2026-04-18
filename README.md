# Forge v0.1 Language Specification <span style="float: right; padding-bottom: 20px;"><img src="https://github.com/user-attachments/assets/88b247f3-f4c9-4687-a352-c521c47fa3c6" width="100" alt="Forge-logo"></span>


## 1. Overview

Forge is a statically checked, JavaScript-targeting programming language designed for readability, structured control flow, expressive return semantics, custom typed enumerations, and intuitive bit manipulation.

Forge emphasizes:
- clear function return behavior through `resolve` and `deliver`
- structured branching via `is`, `not`, `hub`, and `base`
- compile-time analyzable semantics
- custom type support through `custom`
- beginner-friendly and low-level-friendly bit operations

This document defines the syntax, semantics, and type behavior of Forge v0.1.

---

## 2. Design Goals

Forge is intended to provide:

- readable control flow
- explicit and analyzable function behavior
- inferred local variables with explicit function signatures
- strong static analysis
- intuitive data access patterns
- expressive bitwise manipulation without sacrificing clarity

---

## 3. Lexical Elements

### 3.1 Reserved Keywords

The following words are reserved and may not be used as identifiers:

- `abstract` → `shell`
- `arguments` → `params`
- `async`
- `await`
- `boolean` → `hilo`
- `break` → `escape`
- `byte`
- `catch` → `onError`
- `char`
- `class` → `blueprint`
- `const` → `C`
- `continue` → `proceed`
- `debugger` → `raid`
- `default` → `base`
- `delete` → `remove`
- `do` → `execute`
- `double` → `dnum`
- `else` → `not`
- `enum` → `custom`
- `eval` → `expand`
- `export` → `save`
- `extends` → `inherits`
- `false` → `FF`
- `final` → `fin`
- `finally` → `after`
- `float` → `fnum`
- `for` → `whento`
- `function` → `func`
- `goto` → `jump`
- `if` → `is`
- `implements` → `uses`
- `import` → `farm`
- `in` → `look`
- `instanceof` → `istypeof`
- `int` → `inum`
- `interface` → `formed`
- `let`
- `long` → `lnum`
- `native` → `cpp`
- `new` → `create`
- `null` → `non`
- `package` → `wrap`
- `private` → `secret`
- `protected` → `heirs`
- `public` → `overt`
- `return` → `resolve`, `deliver`
- `short` → `snum`
- `static` → `preload`
- `super` → `parent`
- `switch` → `hub`
- `synchronized` → `synced`
- `this` → `$::`
- `throw` → `explode`
- `throws` → `reagent`
- `transient` → `abrupt`
- `true` → `TT`
- `try` → `test`
- `typeof` → `islike`
- `using` → `buildswith`
- `var`
- `void` → `empty`
- `volatile` → `erratic`
- `while` → `whenis`
- `global`

### 3.2 Identifiers

Identifiers:
- are case-sensitive
- must begin with a letter or underscore
- may contain letters, digits, and underscores after the first character
- may not match any reserved keyword

Examples:
```forge
foo
_bar
someValue1
Token
````

### 3.3 Literals

Forge supports the following literal forms:

#### Integer literals

```forge
0
1
42
9001
```

#### Floating-point literals

```forge
3.14
0.5
12.0
```

#### Boolean literals

```forge
TT
FF
```

#### Null literal

```forge
non
```

#### String literals

Strings use double quotes.

```forge
"hello"
"Forge"
"line\nbreak"
```

#### Character literals

Characters use single quotes.

```forge
'a'
'\n'
'Z'
```

### 3.4 Comments

Forge supports both line comments and block comments.

```forge
// this is a line comment

/* this is
   a block comment */
```

### 3.5 Whitespace

Whitespace is insignificant except where needed to separate tokens.

---

## 4. Types

### 4.1 Primitive Types

Forge v0.1 supports these primitive types:

* `byte`
* `char`
* `snum`
* `inum`
* `lnum`
* `fnum`
* `dnum`
* `hilo`
* `empty`

### 4.2 Type Meanings

* `byte`: small integer storage
* `char`: single character
* `snum`: short integer
* `inum`: standard integer
* `lnum`: long integer
* `fnum`: floating-point number
* `dnum`: double-precision floating-point number
* `hilo`: boolean-like truth value
* `empty`: absence of a return value

### 4.3 Type Inference

Local variables may be inferred from their initializer.

```forge
let n = 3;       // inferred as inum
let pi = 3.14;   // inferred as fnum or dnum, implementation-defined
let ok = TT;     // inferred as hilo
```

### 4.4 Explicit Type Annotations

Function parameters and return types are explicit.

```forge
func add(a: inum, b: inum): inum {
  deliver a + b;
}
```

Local variable annotations may also be supported:

```forge
let x: inum = 3;
C y: dnum = 3.14;
```

---

## 5. Type Conversion Rules

### 5.1 Implicit Widening Conversions

Forge allows implicit widening conversions.

Examples:

* `hilo -> inum`
* `byte -> snum -> inum -> lnum`
* `inum -> fnum -> dnum`

### 5.2 Explicit Narrowing Conversions

Narrowing conversions require explicit casts.

Examples:

* `dnum -> inum`
* `lnum -> byte`
* `inum -> hilo`

### 5.3 `hilo` Numeric Resolution

Forge defines:

* `TT` resolves numerically to `1`
* `FF` resolves numerically to `0`

Therefore this is valid:

```forge
func foo(): inum {
  deliver TT;
}
```

### 5.4 Numeric to `hilo` Cast

Casting a numeric value to `hilo` follows:

* `0 -> FF`
* any non-zero value -> `TT`

Example:

```forge
func isPositive(v: inum): hilo {
  is (v < 0) {
    deliver FF;
  }
  deliver (hilo) v;
}
```

---

## 6. Variables and Constants

### 6.1 Mutable Variables

Use `let` for mutable local variables.

```forge
let x = 3;
x = x + 1;
```

### 6.2 Constants

Use `C` for immutable bindings.

```forge
C y = 4;
```

A `C` binding:

* must be initialized at declaration
* may not be reassigned

---

## 7. Globals

Forge supports explicit globals via the `global` keyword.

```forge
global g = {
  someValue: 1,
  someString: "foo",
  constantValue: 3.14
};
```

Globals are accessed through field access:

```forge
g.someValue
g.someString
```

Globals may be shadowed in inner scopes, but the analyzer should emit a warning.

---

## 8. Scope Rules

Forge uses block scope.

A declaration exists only within the block in which it is declared.

```forge
is (TT) {
  let x = 3;
}
// x is out of scope here
```

### 8.1 Shadowing

Shadowing is allowed, but should generate a warning when an inner declaration hides an outer one.

```forge
let x = 1;
is (TT) {
  let x = 2; // allowed, but warn
}
```

---

## 9. Functions

### 9.1 Declaration

Functions use `func`.

```forge
func add(a: inum, b: inum): inum {
  deliver a + b;
}
```

### 9.2 Parameters

Parameters are explicitly typed.

```forge
func scale(v: dnum, factor: dnum): dnum {
  deliver v * factor;
}
```

### 9.3 Return Types

Functions must declare an explicit return type.

```forge
func stop(): empty {
  resolve;
}
```

### 9.4 Return Statements

Forge distinguishes between empty and valued return.

#### Empty return

```forge
resolve;
```

#### Valued return

```forge
deliver expr;
```

### 9.5 Return Semantics

* `resolve` is valid only inside functions returning `empty`
* `deliver expr` is valid only inside functions returning a non-`empty` type
* non-`empty` functions must return a value on all reachable paths

### 9.6 Overloading

Function overloading is permitted by arity only.

Allowed:

```forge
func foo(): inum { deliver 1; }
func foo(a: inum): inum { deliver a; }
func foo(a: inum, b: inum): inum { deliver a + b; }
```

Not allowed:

```forge
func foo(a: inum): inum { deliver a; }
func foo(a: dnum): dnum { deliver a; }
```

---

## 10. Control Flow

### 10.1 If / Else

Forge uses `is` and `not`.

```forge
is (x < y) {
  deliver x;
} not {
  deliver y;
}
```

### 10.2 While Loop

Forge uses `whenis`.

```forge
whenis (x < 10) {
  x = x + 1;
}
```

### 10.3 Do-While Loop

Forge uses `execute ... whenis`.

```forge
execute {
  x = x + 1;
} whenis (x < 10);
```

### 10.4 For Loop

Forge uses `whento`.

```forge
whento (let i = 0; i < 10; i++) {
  // loop body
}
```

### 10.5 Break

Forge uses `escape`.

```forge
escape;
```

`escape` is valid only inside:

* `whenis`
* `whento`
* `hub`

---

## 11. Switch Semantics

Forge uses `hub`, `:{}:`, and `base`.

```forge
hub (x) {
  :{1}: {
    deliver 100;
  }
  :{2}: {
    deliver 200;
  }
  base {
    resolve;
  }
}
```

### 11.1 Case Rules

* case labels must be compile-time constant expressions or literals
* `base` is optional
* at most one `base` clause may appear
* `base` must be the last clause
* no implicit fallthrough occurs between case blocks

### 11.2 Valid `escape`

`escape` is valid within `hub`.

---

## 12. Expressions

### 12.1 Arithmetic Operators

Forge supports:

* `+`
* `-`
* `*`
* `/`
* `%`
* `^`

Examples:

```forge
let sq = n ^ 2;
let sum = a + b;
let q = x / y;
```

### 12.2 Comparison Operators

Forge supports:

* `<`
* `>`
* `<=`
* `>=`
* `==`
* `!=`

### 12.3 Ternary Expression

Forge supports standard ternary form:

```forge
(condition) ? (trueExpr) : (falseExpr)
```

Example:

```forge
let result = (x > 0) ? 1 : -1;
```

---

## 13. Logical Operators

Forge uses symbolic logical operators.

* `!` logical not
* `&&` logical and
* `||` logical or
* `^|` logical xor
* `^&` logical xnor

### 13.1 Truth Tables

#### `&&`

| A  | B  | Result |
| -- | -- | ------ |
| TT | TT | TT     |
| TT | FF | FF     |
| FF | TT | FF     |
| FF | FF | FF     |

#### `||`

| A  | B  | Result |
| -- | -- | ------ |
| TT | TT | TT     |
| TT | FF | TT     |
| FF | TT | TT     |
| FF | FF | FF     |

#### `^|`

| A  | B  | Result |
| -- | -- | ------ |
| TT | TT | FF     |
| TT | FF | TT     |
| FF | TT | TT     |
| FF | FF | FF     |

#### `^&`

| A  | B  | Result |
| -- | -- | ------ |
| TT | TT | TT     |
| TT | FF | FF     |
| FF | TT | FF     |
| FF | FF | TT     |

---

## 14. Bitwise Operations

Forge supports three complementary styles of bit manipulation:

* symbolic single-character bitwise operators
* readable word-based bitwise operators
* indexed bit access
* mask helper functions

### 14.1 Symbolic Bitwise Operators

Single-character operators are bitwise.

* `&` bitwise and
* `|` bitwise or

Examples:

```forge
x & y
x | y
```

### 14.2 Word-Based Bitwise Operators

Forge also supports readable word-based bitwise operators.

* `bitand`
* `bitor`
* `bitxor`
* `bitnot`
* `shiftl`
* `shiftr`

Examples:

```forge
x bitand y
x bitor y
x bitxor y
bitnot x
x shiftl 2
x shiftr 1
```

### 14.3 Indexed Bit Access

Forge supports direct bit indexing using braces.

```forge
x{3}
x{3} = TT
x{3} = FF
```

Semantics:

* `x{n}` reads bit `n` as `hilo`
* assigning `TT` sets bit `n`
* assigning `FF` clears bit `n`

### 14.4 Mask Helpers

Forge provides helper-style bit operations:

* `hasbits(x, mask)`
* `setbits(x, mask)`
* `clearbits(x, mask)`
* `togglebits(x, mask)`

Examples:

```forge
hasbits(flags, 4)
setbits(flags, 2)
clearbits(flags, 8)
togglebits(flags, 1)
```

### 14.5 Valid Operand Types

Bitwise operations are valid on integer-like types only:

* `byte`
* `snum`
* `inum`
* `lnum`

Bitwise operations are not valid on:

* `fnum`
* `dnum`
* `hilo` unless explicitly cast
* strings
* custom enum payloads unless their underlying stored value is integer-compatible

---

## 15. Arrays and Indexing

### 15.1 Indexing

Forge uses standard array indexing.

```forge
arr[0]
arr[i]
```

### 15.2 Slicing

Forge supports range indexing with inclusive start and exclusive end.

```forge
arr[0:arr.length]
```

### 15.3 Slice Semantics

* start index is inclusive
* end index is exclusive
* valid for arrays
* valid for strings

### 15.4 Bounds Failure

Out-of-range indexing behavior is implementation-defined in v0.1, but should be documented clearly by the compiler/runtime.

---

## 16. Custom Types

Forge uses `custom` for enum-like and value-associated custom types.

### 16.1 Plain Custom Type

```forge
custom Color = {
  Red, Green, Blue;
}
```

### 16.2 Valued Custom Type

```forge
custom Token = {
  Pi(3.14),
  Count(21),
  Enabled(TT),
  Disabled(FF),
  Roar("Roar!"),
  Newline('\n');
}
```

### 16.3 Semantic Rules

* member names must be unique
* optional payload must be a compile-time literal
* members are addressable by:

  * ordinal index
  * member name
  * payload value if lookup is unambiguous
* invalid lookup returns `non`
* ambiguous payload lookup also returns `non`

### 16.4 Access Forms

#### Dot access

```forge
let x = Token.Pi;
```

#### Ordinal lookup

```forge
let x = Token[0];
```

#### Name lookup

```forge
let x = Token["Pi"];
```

#### Value lookup

```forge
let x = Token[3.14];
```

### 16.5 Hub Compatibility

Custom-type members may be used directly inside `hub` case labels, provided the case value is compile-time constant.

---

## 17. Globals, Objects, and Field Access

Forge supports field access using `.`.

```forge
g.someValue
Token.Pi
```

Method access may use `->` when methods are introduced in later revisions.

---

## 18. Static Analysis Requirements

The Forge analyzer should detect at minimum:

* undeclared identifier use
* duplicate declarations in the same scope
* shadowing warnings
* assignment to constants
* invalid use of `resolve`
* invalid use of `deliver`
* invalid use of `escape`
* missing return in non-`empty` functions
* wrong argument count in function calls
* wrong argument types
* incompatible assignment types
* invalid operator/type combinations
* duplicate case labels
* multiple `base` clauses
* non-constant case labels where disallowed
* ambiguous custom-type payload lookup when statically knowable

---

## 19. Examples

### 19.1 Simple Function

```forge
func add(a: inum, b: inum): inum {
  deliver a + b;
}
```

### 19.2 Empty Function

```forge
func stop(): empty {
  resolve;
}
```

### 19.3 If / Else

```forge
func max(a: inum, b: inum): inum {
  is (a > b) {
    deliver a;
  } not {
    deliver b;
  }
}
```

### 19.4 Globals

```forge
global g = {
  someValue: 1,
  someString: "foo",
  constantValue: 3.14
};

func readGlobal(): inum {
  deliver g.someValue;
}
```

### 19.5 Custom Type

```forge
custom Token = {
  Pi(3.14),
  Count(21),
  Enabled(TT);
}

func getPi(): dnum {
  deliver Token.Pi;
}
```

### 19.6 Bit Access

```forge
let flags = 0;
flags{3} = TT;
flags{1} = TT;
flags = flags shiftl 1;
```

### 19.7 Do-While

```forge
let n = 0;

execute {
  n = n + 1;
} whenis (n < 5);
```

---

## 20. Future Work

Potential future additions for Forge include:

* `blueprint` classes
* inheritance through `inherits`
* visibility modifiers (`secret`, `heirs`, `overt`)
* exceptions with `test`, `onError`, and `after`
* async workflows with `async` and `await`
* interfaces via `formed`

These features are not required for Forge v0.1.

---

## 21. Summary

Forge v0.1 provides:

* statically checked functions
* explicit return semantics
* structured control flow
* custom typed enums
* global namespaces
* array indexing and slicing
* expressive and readable bit operations

Forge is designed to be both analyzable and expressive, with a syntax that supports real compiler construction and meaningful static analysis.
