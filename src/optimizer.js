import * as core from "./core.js"

function foldBinary(op, lv, rv) {
  switch (op) {
    case "+":
      return lv + rv
    case "-":
      return lv - rv
    case "*":
      return lv * rv
    case "/":
      return rv !== 0 ? lv / rv : null
    case "%":
      return rv !== 0 ? lv % rv : null
    case "^":
      return lv ** rv
    case "<":
      return lv < rv
    case ">":
      return lv > rv
    case "<=":
      return lv <= rv
    case ">=":
      return lv >= rv
    case "==":
      return lv === rv
    case "!=":
      return lv !== rv
    case "&&":
      return lv && rv
    case "||":
      return lv || rv
    case "^|":
      return !lv !== !rv
    case "^&":
      return !lv === !rv
    case "bitand":
    case "&":
      return (lv & rv) | 0
    case "bitor":
    case "|":
      return lv | rv | 0
    case "bitxor":
      return (lv ^ rv) | 0
    case "shiftl":
      return (lv << rv) | 0
    case "shiftr":
      return (lv >> rv) | 0
    default:
      return null
  }
}

function isLit(n) {
  return n.kind === "IntLit" || n.kind === "FloatLit" || n.kind === "BoolLit"
}

function makeLit(val) {
  if (typeof val === "boolean") return core.boolLit(val)
  if (Number.isInteger(val)) return core.intLit(val)
  return core.floatLit(val)
}

function optExpr(n) {
  if (optExprs[n.kind]) return optExprs[n.kind](n)
  return n
}

function optStmt(n) {
  if (optStmts[n.kind]) return optStmts[n.kind](n)
  return n
}

function optBlock(n) {
  const stmts = []
  for (const s of n.statements) {
    const os = optStmt(s)
    if (os.kind === "Block") {
      stmts.push(...os.statements)
    } else {
      stmts.push(os)
    }
    if (s.kind === "ReturnStmt" || s.kind === "BreakStmt") break
  }
  return core.block(stmts)
}

const optStmts = {
  FuncDecl: (n) => ({ ...n, body: optBlock(n.body) }),
  CustomDecl: (n) => n,
  GlobalDecl: (n) => n,
  VarDecl: (n) => ({ ...n, initializer: optExpr(n.initializer) }),
  AssignStmt: (n) => ({ ...n, value: optExpr(n.value) }),
  BitSetStmt: (n) => ({ ...n, index: optExpr(n.index) }),
  CompoundAssignStmt: (n) => ({ ...n, value: optExpr(n.value) }),
  ReturnStmt: (n) => ({ ...n, expression: n.expression ? optExpr(n.expression) : null }),
  BreakStmt: (n) => n,
  ExprStmt: (n) => ({ ...n, expression: optExpr(n.expression) }),

  IfStmt(n) {
    const cond = optExpr(n.condition)
    if (cond.kind === "BoolLit") {
      return cond.value
        ? optBlock(n.consequent)
        : n.alternate
          ? optBlock(n.alternate)
          : core.block([])
    }
    return {
      ...n,
      condition: cond,
      consequent: optBlock(n.consequent),
      alternate: n.alternate ? optBlock(n.alternate) : null,
    }
  },

  WhileStmt(n) {
    const cond = optExpr(n.condition)
    if (cond.kind === "BoolLit" && !cond.value) return core.block([])
    return { ...n, condition: cond, body: optBlock(n.body) }
  },

  DoWhileStmt: (n) => ({ ...n, body: optBlock(n.body), condition: optExpr(n.condition) }),
  ForStmt: (n) => ({ ...n, body: optBlock(n.body) }),

  SwitchStmt: (n) => ({
    ...n,
    cases: n.cases.map((c) => ({ ...c, body: optBlock(c.body) })),
    defaultCase: n.defaultCase ? optBlock(n.defaultCase) : null,
  }),

  Block: (n) => optBlock(n),
}

const optExprs = {
  BinaryExp(n) {
    const l = optExpr(n.left)
    const r = optExpr(n.right)
    if (isLit(l) && isLit(r)) {
      const v = foldBinary(n.op, l.value, r.value)
      if (v !== null && v !== undefined) return makeLit(v)
    }
    if (n.op === "+" && r.kind === "IntLit" && r.value === 0) return l
    if (n.op === "+" && l.kind === "IntLit" && l.value === 0) return r
    if (n.op === "-" && r.kind === "IntLit" && r.value === 0) return l
    if (n.op === "*" && r.kind === "IntLit" && r.value === 1) return l
    if (n.op === "*" && l.kind === "IntLit" && l.value === 1) return r
    if (n.op === "*" && r.kind === "IntLit" && r.value === 0) return core.intLit(0)
    if (n.op === "*" && l.kind === "IntLit" && l.value === 0) return core.intLit(0)
    if (n.op === "^" && r.kind === "IntLit" && r.value === 1) return l
    if (n.op === "^" && r.kind === "IntLit" && r.value === 0) return core.intLit(1)
    return { ...n, left: l, right: r }
  },

  UnaryExp(n) {
    const operand = optExpr(n.operand)
    if (n.op === "-" && operand.kind === "IntLit") return core.intLit(-operand.value)
    if (n.op === "-" && operand.kind === "FloatLit") return core.floatLit(-operand.value)
    if (n.op === "!" && operand.kind === "BoolLit") return core.boolLit(!operand.value)
    return { ...n, operand }
  },

  Ternary(n) {
    const cond = optExpr(n.condition)
    if (cond.kind === "BoolLit") {
      return cond.value ? optExpr(n.consequent) : optExpr(n.alternate)
    }
    return {
      ...n,
      condition: cond,
      consequent: optExpr(n.consequent),
      alternate: optExpr(n.alternate),
    }
  },

  CallExp: (n) => ({ ...n, args: n.args.map(optExpr) }),
  FieldExp: (n) => ({ ...n, object: optExpr(n.object) }),
  PreIncDec: (n) => n,
  PostIncDec: (n) => n,
  BitIndexExp: (n) => ({ ...n, index: optExpr(n.index) }),
  SliceExp: (n) => ({ ...n, start: optExpr(n.start), end: optExpr(n.end) }),
  IndexExp: (n) => ({ ...n, index: optExpr(n.index) }),
  IdExp: (n) => n,
  IntLit: (n) => n,
  FloatLit: (n) => n,
  BoolLit: (n) => n,
  StringLit: (n) => n,
  CharLit: (n) => n,
  NullLit: (n) => n,
}

export function optimize(program) {
  return { ...program, statements: program.statements.map(optStmt) }
}
