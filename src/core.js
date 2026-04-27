export const BYTE = Object.freeze({ kind: "byte" })
export const CHAR = Object.freeze({ kind: "char" })
export const SNUM = Object.freeze({ kind: "snum" })
export const INUM = Object.freeze({ kind: "inum" })
export const LNUM = Object.freeze({ kind: "lnum" })
export const FNUM = Object.freeze({ kind: "fnum" })
export const DNUM = Object.freeze({ kind: "dnum" })
export const HILO = Object.freeze({ kind: "hilo" })
export const EMPTY = Object.freeze({ kind: "empty" })
export const ANY = Object.freeze({ kind: "any" })

export const typeFromName = {
  byte: BYTE,
  char: CHAR,
  snum: SNUM,
  inum: INUM,
  lnum: LNUM,
  fnum: FNUM,
  dnum: DNUM,
  hilo: HILO,
  empty: EMPTY,
}

export function customType(name) {
  return { kind: "custom", name }
}

export function arrayType(base) {
  return { kind: "array", base }
}

export function isIntegerType(t) {
  return t === BYTE || t === SNUM || t === INUM || t === LNUM
}

export function isNumericType(t) {
  return t === BYTE || t === SNUM || t === INUM || t === LNUM || t === FNUM || t === DNUM
}

export function isAssignableTo(from, to) {
  if (from === to) return true
  if (from === ANY || to === ANY) return true
  const chain = [BYTE, SNUM, INUM, LNUM, FNUM, DNUM]
  const fi = chain.indexOf(from)
  const ti = chain.indexOf(to)
  if (fi >= 0 && ti >= 0 && fi <= ti) return true
  if (from === HILO && (to === INUM || to === LNUM || to === FNUM || to === DNUM)) return true
  return false
}

export const program = (statements) => ({ kind: "Program", statements })
export const funcDecl = (name, params, returnType, body) => ({
  kind: "FuncDecl",
  name,
  params,
  returnType,
  body,
})
export const param = (name, type) => ({ kind: "Param", name, type })
export const customDecl = (name, members) => ({ kind: "CustomDecl", name, members })
export const customMember = (name, value) => ({ kind: "CustomMember", name, value })
export const globalDecl = (name, fields) => ({ kind: "GlobalDecl", name, fields })
export const globalField = (name, value) => ({ kind: "GlobalField", name, value })
export const varDecl = (name, type, initializer, readOnly) => ({
  kind: "VarDecl",
  name,
  type,
  initializer,
  readOnly,
})
export const assignStmt = (target, value) => ({ kind: "AssignStmt", target, value })
export const bitSetStmt = (name, index, flag) => ({ kind: "BitSetStmt", name, index, flag })
export const compoundAssignStmt = (name, op, value) => ({
  kind: "CompoundAssignStmt",
  name,
  op,
  value,
})
export const returnStmt = (expression) => ({ kind: "ReturnStmt", expression })
export const breakStmt = () => ({ kind: "BreakStmt" })
export const ifStmt = (condition, consequent, alternate) => ({
  kind: "IfStmt",
  condition,
  consequent,
  alternate,
})
export const whileStmt = (condition, body) => ({ kind: "WhileStmt", condition, body })
export const doWhileStmt = (body, condition) => ({ kind: "DoWhileStmt", body, condition })
export const forStmt = (init, condition, update, body) => ({
  kind: "ForStmt",
  init,
  condition,
  update,
  body,
})
export const switchStmt = (discriminant, cases, defaultCase) => ({
  kind: "SwitchStmt",
  discriminant,
  cases,
  defaultCase,
})
export const caseClause = (test, body) => ({ kind: "CaseClause", test, body })
export const block = (statements) => ({ kind: "Block", statements })
export const exprStmt = (expression) => ({ kind: "ExprStmt", expression })
export const ternary = (condition, consequent, alternate) => ({
  kind: "Ternary",
  condition,
  consequent,
  alternate,
})
export const binaryExp = (op, left, right) => ({ kind: "BinaryExp", op, left, right })
export const unaryExp = (op, operand) => ({ kind: "UnaryExp", op, operand })
export const preIncDec = (op, name) => ({ kind: "PreIncDec", op, name })
export const postIncDec = (op, operand) => ({ kind: "PostIncDec", op, operand })
export const callExp = (callee, args) => ({ kind: "CallExp", callee, args })
export const fieldExp = (object, field) => ({ kind: "FieldExp", object, field })
export const bitIndexExp = (name, index) => ({ kind: "BitIndexExp", name, index })
export const sliceExp = (name, start, end) => ({ kind: "SliceExp", name, start, end })
export const indexExp = (name, index) => ({ kind: "IndexExp", name, index })
export const idExp = (name) => ({ kind: "IdExp", name })
export const intLit = (value) => ({ kind: "IntLit", value, type: INUM })
export const floatLit = (value) => ({ kind: "FloatLit", value, type: DNUM })
export const boolLit = (value) => ({ kind: "BoolLit", value, type: HILO })
export const stringLit = (value) => ({ kind: "StringLit", value })
export const charLit = (value) => ({ kind: "CharLit", value, type: CHAR })
export const nullLit = () => ({ kind: "NullLit", type: ANY })
