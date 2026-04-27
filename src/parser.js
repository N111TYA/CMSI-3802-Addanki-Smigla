import * as ohm from "ohm-js"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import * as core from "./core.js"

const __dir = dirname(fileURLToPath(import.meta.url))
const grammar = ohm.grammar(readFileSync(join(__dir, "forge.ohm"), "utf8"))
const semantics = grammar.createSemantics()

semantics.addOperation("ast", {
  Program(stmts) {
    return core.program(stmts.children.map((s) => s.ast()))
  },

  FuncDecl(_func, name, _lp, params, _rp, _colon, type, body) {
    return core.funcDecl(
      name.sourceString,
      params.asIteration().children.map((p) => p.ast()),
      type.ast(),
      body.ast(),
    )
  },
  Param(name, _colon, type) {
    return core.param(name.sourceString, type.ast())
  },

  Type_byte(_) {
    return core.BYTE
  },
  Type_char(_) {
    return core.CHAR
  },
  Type_snum(_) {
    return core.SNUM
  },
  Type_inum(_) {
    return core.INUM
  },
  Type_lnum(_) {
    return core.LNUM
  },
  Type_fnum(_) {
    return core.FNUM
  },
  Type_dnum(_) {
    return core.DNUM
  },
  Type_hilo(_) {
    return core.HILO
  },
  Type_empty(_) {
    return core.EMPTY
  },
  Type_custom(id) {
    return core.customType(id.sourceString)
  },

  CustomDecl(_custom, name, _eq, _lb, members, _semi, _rb) {
    return core.customDecl(
      name.sourceString,
      members.asIteration().children.map((m) => m.ast()),
    )
  },
  CustomMember_valued(name, _lp, val, _rp) {
    return core.customMember(name.sourceString, val.ast())
  },
  CustomMember_plain(name) {
    return core.customMember(name.sourceString, null)
  },

  GlobalDecl(_global, name, _eq, _lb, fields, _rb, _semi) {
    return core.globalDecl(
      name.sourceString,
      fields.asIteration().children.map((f) => f.ast()),
    )
  },
  GlobalField(name, _colon, val) {
    return core.globalField(name.sourceString, val.ast())
  },

  VarDecl_typed(_let, name, _colon, type, _eq, expr, _semi) {
    return core.varDecl(name.sourceString, type.ast(), expr.ast(), false)
  },
  VarDecl_inferred(_let, name, _eq, expr, _semi) {
    return core.varDecl(name.sourceString, null, expr.ast(), false)
  },
  ConstDecl_typed(_C, name, _colon, type, _eq, expr, _semi) {
    return core.varDecl(name.sourceString, type.ast(), expr.ast(), true)
  },
  ConstDecl_inferred(_C, name, _eq, expr, _semi) {
    return core.varDecl(name.sourceString, null, expr.ast(), true)
  },

  AssignStmt_bitset(name, _lb, idx, _rb, _eq, flag, _semi) {
    return core.bitSetStmt(name.sourceString, idx.ast(), flag.sourceString === "TT")
  },
  AssignStmt_simple(name, _eq, expr, _semi) {
    return core.assignStmt(name.sourceString, expr.ast())
  },
  CompoundAssignStmt(name, op, expr, _semi) {
    return core.compoundAssignStmt(name.sourceString, op.sourceString, expr.ast())
  },

  ReturnStmt_empty(_resolve, _semi) {
    return core.returnStmt(null)
  },
  ReturnStmt_value(_deliver, expr, _semi) {
    return core.returnStmt(expr.ast())
  },

  BreakStmt(_escape, _semi) {
    return core.breakStmt()
  },

  IfStmt(_is, _lp, cond, _rp, body, notKw, alt) {
    const altBlock = alt.children.length ? alt.children[0].ast() : null
    return core.ifStmt(cond.ast(), body.ast(), altBlock)
  },

  WhileStmt(_whenis, _lp, cond, _rp, body) {
    return core.whileStmt(cond.ast(), body.ast())
  },

  DoWhileStmt(_execute, body, _whenis, _lp, cond, _rp, _semi) {
    return core.doWhileStmt(body.ast(), cond.ast())
  },

  ForStmt(_whento, _lp, init, _semi1, cond, _semi2, update, _rp, body) {
    return core.forStmt(init.ast(), cond.ast(), update.ast(), body.ast())
  },
  ForInit_decl(_let, name, _eq, expr) {
    return core.varDecl(name.sourceString, null, expr.ast(), false)
  },
  ForInit_assign(name, _eq, expr) {
    return core.assignStmt(name.sourceString, expr.ast())
  },
  ForUpdate_postInc(name, _op) {
    return core.postIncDec("++", core.idExp(name.sourceString))
  },
  ForUpdate_postDec(name, _op) {
    return core.postIncDec("--", core.idExp(name.sourceString))
  },
  ForUpdate_preInc(_op, name) {
    return core.preIncDec("++", name.sourceString)
  },
  ForUpdate_preDec(_op, name) {
    return core.preIncDec("--", name.sourceString)
  },
  ForUpdate_compound(name, op, expr) {
    return core.compoundAssignStmt(name.sourceString, op.sourceString, expr.ast())
  },

  SwitchStmt(_hub, _lp, disc, _rp, _lb, cases, defClause, _rb) {
    const d = defClause.children.length ? defClause.children[0].ast() : null
    return core.switchStmt(
      disc.ast(),
      cases.children.map((c) => c.ast()),
      d,
    )
  },
  CaseClause(_lbr, expr, _rbr, body) {
    return core.caseClause(expr.ast(), body.ast())
  },
  DefaultClause(_base, body) {
    return body.ast()
  },

  Block(_lb, stmts, _rb) {
    return core.block(stmts.children.map((s) => s.ast()))
  },
  ExprStmt(expr, _semi) {
    return core.exprStmt(expr.ast())
  },

  Ternary_ternary(cond, _q, cons, _colon, alt) {
    return core.ternary(cond.ast(), cons.ast(), alt.ast())
  },
  Ternary_passthru(e) {
    return e.ast()
  },

  LogOrExp_or(l, _op, r) {
    return core.binaryExp("||", l.ast(), r.ast())
  },
  LogOrExp_xor(l, _op, r) {
    return core.binaryExp("^|", l.ast(), r.ast())
  },
  LogOrExp_passthru(e) {
    return e.ast()
  },

  LogXorExp_xnor(l, _op, r) {
    return core.binaryExp("^&", l.ast(), r.ast())
  },
  LogXorExp_passthru(e) {
    return e.ast()
  },

  LogAndExp_and(l, _op, r) {
    return core.binaryExp("&&", l.ast(), r.ast())
  },
  LogAndExp_passthru(e) {
    return e.ast()
  },

  EqExp_eq(l, _op, r) {
    return core.binaryExp("==", l.ast(), r.ast())
  },
  EqExp_ne(l, _op, r) {
    return core.binaryExp("!=", l.ast(), r.ast())
  },
  EqExp_passthru(e) {
    return e.ast()
  },

  RelExp_le(l, _op, r) {
    return core.binaryExp("<=", l.ast(), r.ast())
  },
  RelExp_ge(l, _op, r) {
    return core.binaryExp(">=", l.ast(), r.ast())
  },
  RelExp_lt(l, _op, r) {
    return core.binaryExp("<", l.ast(), r.ast())
  },
  RelExp_gt(l, _op, r) {
    return core.binaryExp(">", l.ast(), r.ast())
  },
  RelExp_passthru(e) {
    return e.ast()
  },

  AddExp_plus(l, _op, r) {
    return core.binaryExp("+", l.ast(), r.ast())
  },
  AddExp_minus(l, _op, r) {
    return core.binaryExp("-", l.ast(), r.ast())
  },
  AddExp_passthru(e) {
    return e.ast()
  },

  MulExp_times(l, _op, r) {
    return core.binaryExp("*", l.ast(), r.ast())
  },
  MulExp_divide(l, _op, r) {
    return core.binaryExp("/", l.ast(), r.ast())
  },
  MulExp_mod(l, _op, r) {
    return core.binaryExp("%", l.ast(), r.ast())
  },
  MulExp_passthru(e) {
    return e.ast()
  },

  BitExp_bitand(l, _op, r) {
    return core.binaryExp("bitand", l.ast(), r.ast())
  },
  BitExp_bitor(l, _op, r) {
    return core.binaryExp("bitor", l.ast(), r.ast())
  },
  BitExp_bitxor(l, _op, r) {
    return core.binaryExp("bitxor", l.ast(), r.ast())
  },
  BitExp_shiftl(l, _op, r) {
    return core.binaryExp("shiftl", l.ast(), r.ast())
  },
  BitExp_shiftr(l, _op, r) {
    return core.binaryExp("shiftr", l.ast(), r.ast())
  },
  BitExp_symbAnd(l, _op, r) {
    return core.binaryExp("&", l.ast(), r.ast())
  },
  BitExp_symbOr(l, _op, r) {
    return core.binaryExp("|", l.ast(), r.ast())
  },
  BitExp_passthru(e) {
    return e.ast()
  },

  ExpExp_power(l, _op, r) {
    return core.binaryExp("^", l.ast(), r.ast())
  },
  ExpExp_passthru(e) {
    return e.ast()
  },

  UnaryExp_preInc(_op, id) {
    return core.preIncDec("++", id.sourceString)
  },
  UnaryExp_preDec(_op, id) {
    return core.preIncDec("--", id.sourceString)
  },
  UnaryExp_not(_op, e) {
    return core.unaryExp("!", e.ast())
  },
  UnaryExp_neg(_op, e) {
    return core.unaryExp("-", e.ast())
  },
  UnaryExp_bitnot(_op, e) {
    return core.unaryExp("bitnot", e.ast())
  },
  UnaryExp_passthru(e) {
    return e.ast()
  },

  PostfixExp_postInc(e, _op) {
    return core.postIncDec("++", e.ast())
  },
  PostfixExp_postDec(e, _op) {
    return core.postIncDec("--", e.ast())
  },
  PostfixExp_passthru(e) {
    return e.ast()
  },

  CallExp_call(name, _lp, args, _rp) {
    return core.callExp(
      name.sourceString,
      args.asIteration().children.map((a) => a.ast()),
    )
  },
  CallExp_passthru(e) {
    return e.ast()
  },

  MemberExp_field(obj, _dot, field) {
    return core.fieldExp(obj.ast(), field.sourceString)
  },
  MemberExp_bitIndex(name, _lb, idx, _rb) {
    return core.bitIndexExp(name.sourceString, idx.ast())
  },
  MemberExp_slice(name, _lb, s, _colon, e, _rb) {
    return core.sliceExp(name.sourceString, s.ast(), e.ast())
  },
  MemberExp_index(name, _lb, idx, _rb) {
    return core.indexExp(name.sourceString, idx.ast())
  },
  MemberExp_passthru(e) {
    return e.ast()
  },

  PriExp_paren(_lp, e, _rp) {
    return e.ast()
  },
  PriExp_bool(b) {
    return core.boolLit(b.sourceString === "TT")
  },
  PriExp_null(_) {
    return core.nullLit()
  },
  PriExp_string(s) {
    return core.stringLit(s.sourceString.slice(1, -1))
  },
  PriExp_char(c) {
    return core.charLit(c.sourceString.slice(1, -1))
  },
  PriExp_num(n) {
    return n.ast()
  },
  PriExp_id(id) {
    return core.idExp(id.sourceString)
  },

  numlit_float(whole, _dot, frac) {
    return core.floatLit(parseFloat(whole.sourceString + "." + frac.sourceString))
  },
  numlit_int(digits) {
    return core.intLit(parseInt(digits.sourceString, 10))
  },

  boollit(b) {
    return core.boolLit(b.sourceString === "TT")
  },
  strlit(_open, _chars, _close) {
    return core.stringLit(this.sourceString.slice(1, -1))
  },
  charlit(_open, _ch, _close) {
    return core.charLit(this.sourceString.slice(1, -1))
  },
  literal(e) {
    return e.ast()
  },

  _iter(...children) {
    return children.map((c) => c.ast())
  },
  _terminal() {
    return this.sourceString
  },

  id(_first, _rest) {
    return this.sourceString
  },
})

export function parse(source) {
  const match = grammar.match(source)
  if (match.failed()) throw new Error(match.message)
  return semantics(match).ast()
}
