---
name: academic-prover
description: Formal verification with Lean 4, Coq, and Z3 SMT solver via the container's prover server.
metadata:
  openclaw:
    emoji: "🔮"
    os: ["linux"]
    category: academic
---

# Academic Prover — Formal Verification

## Overview

This skill provides access to three formal verification tools:
- **Lean 4** (v4.27) — dependently-typed programming and theorem proving
- **Coq** (v8.18) — interactive proof assistant
- **Z3** (v4.15) — SMT solver for satisfiability and optimization

All tools are accessed via the prover server at `http://localhost:8081`.

## When To Use

- User asks to verify a proof, type-check code, or solve logical formulas
- User provides Lean 4, Coq, or Z3/SMT-LIB code
- User wants help with formal methods, theorem proving, or satisfiability checking

## Lean 4

### Type check

```bash
curl -sf -X POST http://localhost:8081/lean/check \
  -H "Content-Type: application/json" \
  -d '{"code": "#check Nat"}' | jq .
# → {"success": true, "output": "Nat : Type\n", "errors": "", "returncode": 0}
```

### Evaluate / Run

```bash
curl -sf -X POST http://localhost:8081/lean/run \
  -H "Content-Type: application/json" \
  -d '{"code": "#eval 2 + 3"}' | jq .
# → {"success": true, "output": "5\n", ...}
```

### Multi-line example

```bash
curl -sf -X POST http://localhost:8081/lean/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def factorial : Nat → Nat\n  | 0 => 1\n  | n + 1 => (n + 1) * factorial n\n\n#eval factorial 10"
  }' | jq .
```

## Coq

### Verify proof

```bash
curl -sf -X POST http://localhost:8081/coq/check \
  -H "Content-Type: application/json" \
  -d '{
    "code": "Theorem plus_0_r : forall n : nat, n + 0 = n.\nProof.\n  intros n. induction n.\n  - reflexivity.\n  - simpl. rewrite IHn. reflexivity.\nQed."
  }' | jq .
# → {"success": true, "compiled": true, ...}
```

## Z3 (SMT Solver)

### Solve formula (SMT-LIB2 format)

```bash
curl -sf -X POST http://localhost:8081/z3/solve \
  -H "Content-Type: application/json" \
  -d '{
    "formula": "(declare-const x Int)\n(declare-const y Int)\n(assert (= (+ x y) 10))\n(assert (= (- x y) 4))\n(check-sat)\n(get-model)"
  }' | jq .
# → {"success": true, "result": "sat", "model": "[x = 7, y = 3]"}
```

## API Reference

| Endpoint | Method | Body field | Response fields |
|----------|--------|-----------|----------------|
| `/lean/check` | POST | `code` | `success`, `output`, `errors`, `returncode` |
| `/lean/run` | POST | `code` | `success`, `output`, `errors`, `returncode` |
| `/coq/check` | POST | `code` | `success`, `compiled`, `output`, `errors`, `returncode` |
| `/z3/solve` | POST | `formula` | `success`, `result` (sat/unsat/unknown), `model` |
| `/health` | GET | — | `{status, service}` |

## Response Interpretation

### Lean 4
- `success: true` → code is well-typed or evaluated successfully
- `output` contains `#check` types or `#eval` results
- `errors` contains warnings or errors with line numbers

### Coq
- `success: true` + `compiled: true` → proof is valid and fully checked
- Errors indicate which tactic failed and why

### Z3
- `result: "sat"` → satisfiable, `model` shows the solution
- `result: "unsat"` → no solution exists (useful for proving impossibility)
- `result: "unknown"` → solver timed out or formula is undecidable

## Tips

- **Lean 4**: Use `#check` for type inspection, `#eval` for computation.
- **Coq**: Proofs must be self-contained — include all `Require Import` statements.
- **Z3**: Input uses SMT-LIB2 format. Use `(check-sat)` and `(get-model)`.
- All three tools have their full standard libraries available.
- For complex projects, write files to `/workspace/projects/` and use CLI directly.
