import * as core from "./core.js"

class Context {
  constructor(parent = null, opts = {}) {
    this.parent = parent
    this.locals = new Map()
    this.inLoop = opts.inLoop ?? parent?.inLoop ?? false
    this.inSwitch = opts.inSwitch ?? parent?.inSwitch ?? false
    this.returnType = opts.returnType ?? parent?.returnType ?? null
  }

  add(name, entity) {
    if (this.locals.has(name)) throw new Error(`Variable already declared: ${name}`)
    this.locals.set(name, entity)
  }

  lookup(name) {
    if (this.locals.has(name)) return this.locals.get(name)
    if (this.parent) return this.parent.lookup(name)
    throw new Error(`Undeclared identifier: ${name}`)
  }

  child(opts = {}) {
    return new Context(this, opts)
  }
}

function must(condition, message) {
  if (!condition) throw new Error(message)
}

function isConstantExpr(node) {
  return ["IntLit", "FloatLit", "BoolLit", "StringLit", "CharLit"].includes(node.kind)
}

function typeOf(node) {
  return node.type ?? core.ANY
}

function analyzeStmt(node, ctx) {
  const handler = stmtHandlers[node.kind]
  if (!handler) throw new Error(`Unknown statement kind: ${node.kind}`)
  return handler(node, ctx)
}

function analyzeExpr(node, ctx) {
  const handler = exprHandlers[node.kind]
  if (!handler) throw new Error(`Unknown expression kind: ${node.kind}`)
  return handler(node, ctx)
}

function blockAlwaysReturns(block) {
  for (const stmt of block.statements) {
    if (stmtAlwaysReturns(stmt)) return true
  }
  return false
}

function stmtAlwaysReturns(stmt) {
  if (stmt.kind === "ReturnStmt" && stmt.expression !== null) return true
  if (stmt.kind === "IfStmt") {
    return (
      stmt.alternate !== null &&
      blockAlwaysReturns(stmt.consequent) &&
      blockAlwaysReturns(stmt.alternate)
    )
  }
  if (stmt.kind === "SwitchStmt") {
    if (!stmt.defaultCase) return false
    if (!blockAlwaysReturns(stmt.defaultCase)) return false
    return stmt.cases.every(c => blockAlwaysReturns(c.body))
  }
  return false
}

const stmtHandlers = {
  FuncDecl(node, ctx) {
    if (!ctx.locals.has(node.name)) {
      ctx.locals.set(node.name, {
        kind: "Function",
        name: node.name,
        params: node.params,
        returnType: node.returnType,
      })
    }
    const inner = ctx.child({ returnType: node.returnType })
    for (const p of node.params) {
      inner.add(p.name, { kind: "Variable", name: p.name, type: p.type, readOnly: false })
    }
    stmtHandlers.Block(node.body, inner)
    if (node.returnType !== core.EMPTY) {
      must(
        blockAlwaysReturns(node.body),
        `Missing return: function '${node.name}' does not return a value on all code paths`
      )
    }
    return node
  },

  CustomDecl(node, ctx) {
    const names = new Set()
    for (const m of node.members) {
      must(!names.has(m.name), `Duplicate custom member: ${m.name}`)
      names.add(m.name)
    }
    ctx.add(node.name, { kind: "CustomType", name: node.name, members: node.members })
    return node
  },

  GlobalDecl(node, ctx) {
    for (const f of node.fields) analyzeExpr(f.value, ctx)
    ctx.add(node.name, { kind: "Global", name: node.name })
    return node
  },

  VarDecl(node, ctx) {
    const initType = typeOf(analyzeExpr(node.initializer, ctx))
    const declaredType = node.type ?? initType
    if (node.type) {
      must(
        core.isAssignableTo(initType, node.type),
        `Type mismatch in declaration of ${node.name}: cannot assign ${initType.kind} to ${node.type.kind}`,
      )
    }
    node.type = declaredType
    ctx.add(node.name, {
      kind: "Variable",
      name: node.name,
      type: declaredType,
      readOnly: node.readOnly,
    })
    return node
  },

  AssignStmt(node, ctx) {
    const entity = ctx.lookup(node.target)
    must(!entity.readOnly, `Cannot assign to constant: ${node.target}`)
    const valType = typeOf(analyzeExpr(node.value, ctx))
    if (entity.type && entity.type !== core.ANY) {
      must(
        core.isAssignableTo(valType, entity.type),
        `Type mismatch in assignment to ${node.target}: cannot assign ${valType.kind} to ${entity.type.kind}`,
      )
    }
    return node
  },

  BitSetStmt(node, ctx) {
    const entity = ctx.lookup(node.name)
    must(core.isIntegerType(entity.type), `Bit operations require integer type: ${node.name}`)
    analyzeExpr(node.index, ctx)
    return node
  },

  CompoundAssignStmt(node, ctx) {
    const entity = ctx.lookup(node.name)
    must(!entity.readOnly, `Cannot assign to constant: ${node.name}`)
    analyzeExpr(node.value, ctx)
    return node
  },

  ReturnStmt(node, ctx) {
    must(ctx.returnType !== null, "return statement outside of function")
    if (node.expression === null) {
      must(ctx.returnType === core.EMPTY, "resolve can only be used in functions returning empty")
    } else {
      must(ctx.returnType !== core.EMPTY, "deliver cannot be used in functions returning empty")
      const t = typeOf(analyzeExpr(node.expression, ctx))
      must(
        core.isAssignableTo(t, ctx.returnType),
        `Return type mismatch: cannot return ${t.kind} from function returning ${ctx.returnType.kind}`,
      )
    }
    return node
  },

  BreakStmt(node, ctx) {
    must(ctx.inLoop || ctx.inSwitch, "escape must be inside a loop or hub")
    return node
  },

  IfStmt(node, ctx) {
    const condType = typeOf(analyzeExpr(node.condition, ctx))
    must(
      condType === core.HILO || core.isAssignableTo(condType, core.HILO),
      `Condition must be hilo, got ${condType.kind}`,
    )
    stmtHandlers.Block(node.consequent, ctx.child())
    if (node.alternate) stmtHandlers.Block(node.alternate, ctx.child())
    return node
  },

  WhileStmt(node, ctx) {
    analyzeExpr(node.condition, ctx)
    stmtHandlers.Block(node.body, ctx.child({ inLoop: true }))
    return node
  },

  DoWhileStmt(node, ctx) {
    stmtHandlers.Block(node.body, ctx.child({ inLoop: true }))
    analyzeExpr(node.condition, ctx)
    return node
  },

  ForStmt(node, ctx) {
    const inner = ctx.child({ inLoop: true })
    if (node.init.kind === "VarDecl") stmtHandlers.VarDecl(node.init, inner)
    else stmtHandlers.AssignStmt(node.init, inner)
    analyzeExpr(node.condition, inner)
    analyzeForUpdate(node.update, inner)
    stmtHandlers.Block(node.body, inner.child())
    return node
  },

  SwitchStmt(node, ctx) {
    analyzeExpr(node.discriminant, ctx)
    const seen = new Set()
    for (const c of node.cases) {
      analyzeExpr(c.test, ctx)
      must(isConstantExpr(c.test), "Case label in hub must be a constant expression")
      const key = JSON.stringify(c.test)
      must(!seen.has(key), "Duplicate case label in hub")
      seen.add(key)
      stmtHandlers.Block(c.body, ctx.child({ inSwitch: true }))
    }
    // Check 14: grammar enforces at most one DefaultClause via DefaultClause?
    // so node.defaultCase is always null or a single Block here.
    if (node.defaultCase) stmtHandlers.Block(node.defaultCase, ctx.child({ inSwitch: true }))
    return node
  },

  Block(node, ctx) {
    for (const s of node.statements) analyzeStmt(s, ctx)
    return node
  },

  ExprStmt(node, ctx) {
    analyzeExpr(node.expression, ctx)
    return node
  },
}

function analyzeForUpdate(node, ctx) {
  if (node.kind === "PostIncDec") {
    if (node.operand?.kind === "IdExp") {
      const entity = ctx.lookup(node.operand.name)
      must(!entity.readOnly, `Cannot modify constant: ${node.operand.name}`)
    }
  } else if (node.kind === "PreIncDec") {
    const entity = ctx.lookup(node.name)
    must(!entity.readOnly, `Cannot modify constant: ${node.name}`)
  } else if (node.kind === "CompoundAssignStmt") {
    stmtHandlers.CompoundAssignStmt(node, ctx)
  }
}

const exprHandlers = {
  Ternary(node, ctx) {
    analyzeExpr(node.condition, ctx)
    const t1 = typeOf(analyzeExpr(node.consequent, ctx))
    const t2 = typeOf(analyzeExpr(node.alternate, ctx))
    node.type = core.isAssignableTo(t1, t2) ? t2 : t1
    return node
  },

  BinaryExp(node, ctx) {
    const left = analyzeExpr(node.left, ctx)
    const right = analyzeExpr(node.right, ctx)
    const lt = typeOf(left)
    const rt = typeOf(right)
    const bitOps = ["bitand", "bitor", "bitxor", "shiftl", "shiftr", "&", "|"]
    const logicOps = ["&&", "||", "^|", "^&"]
    const numOps = ["+", "-", "*", "/", "%", "^"]
    const cmpOps = ["<", ">", "<=", ">=", "==", "!="]
    if (bitOps.includes(node.op)) {
      must(
        core.isIntegerType(lt),
        `Left operand of ${node.op} must be an integer type, got ${lt.kind}`,
      )
      must(
        core.isIntegerType(rt),
        `Right operand of ${node.op} must be an integer type, got ${rt.kind}`,
      )
      node.type = lt
    } else if (logicOps.includes(node.op)) {
      node.type = core.HILO
    } else if (numOps.includes(node.op)) {
      must(
        core.isNumericType(lt) || lt === core.ANY,
        `Left operand of ${node.op} must be numeric, got ${lt.kind}`,
      )
      must(
        core.isNumericType(rt) || rt === core.ANY,
        `Right operand of ${node.op} must be numeric, got ${rt.kind}`,
      )
      node.type = core.isAssignableTo(lt, rt) ? rt : lt
    } else if (cmpOps.includes(node.op)) {
      node.type = core.HILO
    }
    return node
  },

  UnaryExp(node, ctx) {
    const operand = analyzeExpr(node.operand, ctx)
    const t = typeOf(operand)
    if (node.op === "!") {
      node.type = core.HILO
    } else if (node.op === "bitnot") {
      must(
        core.isIntegerType(t) || t === core.ANY,
        `bitnot requires integer operand, got ${t.kind}`,
      )
      node.type = t
    } else {
      node.type = t
    }
    return node
  },

  PreIncDec(node, ctx) {
    const entity = ctx.lookup(node.name)
    must(!entity.readOnly, `Cannot modify constant: ${node.name}`)
    node.type = entity.type ?? core.ANY
    return node
  },

  PostIncDec(node, ctx) {
    if (node.operand?.kind === "IdExp") {
      const entity = ctx.lookup(node.operand.name)
      must(!entity.readOnly, `Cannot modify constant: ${node.operand.name}`)
      node.type = entity.type ?? core.ANY
    }
    return node
  },

  CallExp(node, ctx) {
    const entity = ctx.lookup(node.callee)
    must(entity.kind === "Function", `${node.callee} is not a function`)
    must(
      node.args.length === entity.params.length,
      `${node.callee} expects ${entity.params.length} argument(s), got ${node.args.length}`,
    )
    for (let i = 0; i < node.args.length; i++) {
      const argType = typeOf(analyzeExpr(node.args[i], ctx))
      must(
        core.isAssignableTo(argType, entity.params[i].type),
        `Argument ${i + 1} type mismatch in call to ${node.callee}: expected ${entity.params[i].type.kind}, got ${argType.kind}`,
      )
    }
    node.type = entity.returnType
    return node
  },

  FieldExp(node, ctx) {
    analyzeExpr(node.object, ctx)
    node.type = core.ANY
    return node
  },

  BitIndexExp(node, ctx) {
    const entity = ctx.lookup(node.name)
    must(
      core.isIntegerType(entity.type) || entity.type === core.ANY,
      `Bit index requires integer: ${node.name}`,
    )
    analyzeExpr(node.index, ctx)
    node.type = core.HILO
    return node
  },

  SliceExp(node, ctx) {
    ctx.lookup(node.name)
    analyzeExpr(node.start, ctx)
    analyzeExpr(node.end, ctx)
    node.type = core.ANY
    return node
  },

  IndexExp(node, ctx) {
    ctx.lookup(node.name)
    analyzeExpr(node.index, ctx)
    node.type = core.ANY
    return node
  },

  IdExp(node, ctx) {
    const entity = ctx.lookup(node.name)
    node.type = entity.type ?? core.ANY
    return node
  },

  IntLit(node) {
    return node
  },
  FloatLit(node) {
    return node
  },
  BoolLit(node) {
    return node
  },
  StringLit(node) {
    return node
  },
  CharLit(node) {
    return node
  },
  NullLit(node) {
    return node
  },
}

export function analyze(program) {
  const ctx = new Context()
  stmtHandlers.Block({ kind: "Block", statements: program.statements }, ctx)
  return program
}
