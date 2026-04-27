function gen(node) {
  const g = generators[node.kind]
  if (!g) throw new Error(`No generator for: ${node.kind}`)
  return g(node)
}

const generators = {
  Program: (n) => n.statements.map(gen).join("\n"),

  FuncDecl: (n) =>
    `function ${n.name}(${n.params.map((p) => p.name).join(", ")}) {\n${genBlock(n.body)}\n}`,

  CustomDecl: (n) => {
    const entries = n.members.map((m, i) => `  ${m.name}: ${m.value !== null ? gen(m.value) : i}`)
    return `const ${n.name} = Object.freeze({\n${entries.join(",\n")}\n})`
  },

  GlobalDecl: (n) => {
    const fields = n.fields.map((f) => `  ${f.name}: ${gen(f.value)}`).join(",\n")
    return `const ${n.name} = {\n${fields}\n}`
  },

  VarDecl: (n) => `${n.readOnly ? "const" : "let"} ${n.name} = ${gen(n.initializer)}`,

  AssignStmt: (n) => `${n.target} = ${gen(n.value)}`,

  BitSetStmt: (n) =>
    n.flag
      ? `${n.name} = ${n.name} | (1 << ${gen(n.index)})`
      : `${n.name} = ${n.name} & ~(1 << ${gen(n.index)})`,

  CompoundAssignStmt: (n) => `${n.name} ${n.op} ${gen(n.value)}`,

  ReturnStmt: (n) => (n.expression ? `return ${gen(n.expression)}` : `return`),

  BreakStmt: (_) => `break`,

  IfStmt: (n) => {
    let s = `if (${gen(n.condition)}) {\n${genBlock(n.consequent)}\n}`
    if (n.alternate) s += ` else {\n${genBlock(n.alternate)}\n}`
    return s
  },

  WhileStmt: (n) => `while (${gen(n.condition)}) {\n${genBlock(n.body)}\n}`,

  DoWhileStmt: (n) => `do {\n${genBlock(n.body)}\n} while (${gen(n.condition)})`,

  ForStmt: (n) =>
    `for (${gen(n.init)}; ${gen(n.condition)}; ${gen(n.update)}) {\n${genBlock(n.body)}\n}`,

  SwitchStmt: (n) => {
    const cases = n.cases
      .map((c) => `  case ${gen(c.test)}:\n${genBlock(c.body)}\n    break`)
      .join("\n")
    const def = n.defaultCase ? `\n  default:\n${genBlock(n.defaultCase)}` : ""
    return `switch (${gen(n.discriminant)}) {\n${cases}${def}\n}`
  },

  Block: (n) => genBlock(n),

  ExprStmt: (n) => gen(n.expression),

  Ternary: (n) => `(${gen(n.condition)} ? ${gen(n.consequent)} : ${gen(n.alternate)})`,

  BinaryExp: (n) => {
    const l = gen(n.left)
    const r = gen(n.right)
    const opMap = {
      bitand: "&",
      bitor: "|",
      bitxor: "^",
      shiftl: "<<",
      shiftr: ">>",
      "^": "**",
      "^|": null,
      "^&": null,
    }
    if (n.op === "^|") return `(!!(${l}) !== !!(${r}))`
    if (n.op === "^&") return `(!!(${l}) === !!(${r}))`
    const op = opMap[n.op] !== undefined ? opMap[n.op] : n.op
    return `(${l} ${op} ${r})`
  },

  UnaryExp: (n) => {
    const op = n.op === "bitnot" ? "~" : n.op
    return `${op}(${gen(n.operand)})`
  },

  PreIncDec: (n) => `${n.op}${n.name}`,

  PostIncDec: (n) => {
    const operand = n.operand && n.operand.kind === "IdExp" ? n.operand.name : gen(n.operand)
    return `${operand}${n.op}`
  },

  CallExp: (n) => `${n.callee}(${n.args.map(gen).join(", ")})`,

  FieldExp: (n) => `${gen(n.object)}.${n.field}`,

  BitIndexExp: (n) => `((${n.name} >> ${gen(n.index)}) & 1)`,

  SliceExp: (n) => `${n.name}.slice(${gen(n.start)}, ${gen(n.end)})`,

  IndexExp: (n) => `${n.name}[${gen(n.index)}]`,

  IdExp: (n) => n.name,

  IntLit: (n) => String(n.value),
  FloatLit: (n) => String(n.value),
  BoolLit: (n) => (n.value ? "true" : "false"),
  StringLit: (n) => JSON.stringify(n.value),
  CharLit: (n) => JSON.stringify(n.value),
  NullLit: (_) => "null",
}

function genBlock(n) {
  return n.statements.map((s) => "  " + gen(s)).join("\n")
}

export function generate(program) {
  return gen(program)
}
