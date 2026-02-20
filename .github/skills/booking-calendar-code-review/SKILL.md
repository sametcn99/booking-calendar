---
name: booking-calendar-code-review
description: "Code review workflow for booking-calendar. Use for PR review, patch analysis, and regression-risk checks with findings-first reporting."
argument-hint: "Describe review scope (files/commit/pr)"
user-invocable: true
---

# Booking Calendar Code Review

## When To Use

- Reviewing pull requests before merge.
- Auditing bug-fix patches for regressions.
- Verifying route, transaction, and API contract safety.

## Procedure

1. Scope the review.

- Determine files/commits/PR and risk focus.

2. Evaluate high-risk areas first.

- Runtime correctness and regressions.
- Transaction and overlap safety in write paths.
- Route matching/order risks.
- API contract and i18n consistency.

3. Report findings first.

- Order by severity.
- Include file and line references.
- Add concrete fix guidance.

4. Conclude with risk gaps.

- Missing tests.
- Untested behavior paths.

## Checklist

- Use this review checklist: [reference](./references/review-checklist.md)
