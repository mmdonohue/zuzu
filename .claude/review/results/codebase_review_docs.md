# Codebase Review Report

**Generated**: 2026-06-14 17:53:02 UTC
**Review Version**: 1.0.0
**Commit**: 7743c32 (main)
**Total Findings**: 6


---

## Executive Summary

**Overall Status**: ⚠️ WARNING

| Category | Status | Critical | Warning | Info |
|----------|--------|----------|---------|------|
| Docs | ⚠️ | 0 | 3 | 3 |


---

## Docs Review

### ⚠️ Warnings

#### Missing AuthProvider in CLAUDE.md provider hierarchy

**Location**: `.claude/CLAUDE.md:47`

The provider hierarchy documentation does not mention AuthProvider, but it exists in the code.

**Actual**: Provider hierarchy includes: Redux, QueryClient, BrowserRouter, ThemeProvider, CssBaseline, AuthProvider

**Documented**: Provider hierarchy lists: Redux, QueryClient, BrowserRouter, ThemeProvider, CssBaseline (missing AuthProvider)

**Recommendation**: Add AuthProvider to the provider hierarchy list in CLAUDE.md around line 52

#### Incomplete routing documentation

**Location**: `.claude/CLAUDE.md:54`

Documentation lists 0 routes but codebase has 6 routes.

**Actual**: 6 routes: Portfolio, MoxiLabs, Navigate, MoxiLabsEvents, MoxiLabsEventDetail, Layout

**Documented**: 0 routes: 

**Recommendation**: Update line 54 to include all routes: Portfolio, MoxiLabs, Navigate, MoxiLabsEvents, MoxiLabsEventDetail, Layout

#### Missing /api/auth in backend routes documentation

**Location**: `.claude/CLAUDE.md:72`

The backend routes section does not mention /api/auth endpoint.

**Actual**: Routes include: /api, /api, /api, /api/auth, /api, /api/openrouter, /api/logs, /api/review, /api/templates, /api/style-guides, /api/leetmaster, /api/wta, /api/contact, /api/events, /api/admin

**Documented**: Routes listed do not include /api/auth

**Recommendation**: Add /api/auth to the backend routes list


### ℹ️ Information

#### Technology stack not fully documented in README.md

**Location**: `README.md`

Some major dependencies are not mentioned in the README tech stack section.

**Actual**: Technologies in use: Material-UI (MUI), React Router

**Documented**: Missing from README.md tech stack

**Recommendation**: Consider adding: Material-UI (MUI), React Router

#### README.md missing npm scripts from CLAUDE.md

**Location**: `README.md`

Some npm commands documented in CLAUDE.md are not in README.md.

**Actual**: CLAUDE.md documents: npm serve

**Documented**: Missing from README.md

**Recommendation**: Add command documentation to README.md: serve

#### README.md missing environment variables from CLAUDE.md

**Location**: `README.md`

Some environment variables in CLAUDE.md are not documented in README.md.

**Actual**: CLAUDE.md documents: REACT_APP_ENVIRONMENT

**Documented**: Missing from README.md

**Recommendation**: Consider adding to README.md: REACT_APP_ENVIRONMENT


### Metrics

- **Docs Checked**: 5
- **Claims Verified**: 10
- **Discrepancies**: 6


---

## Recommendations Summary

### High Priority (Warnings)
1. Add AuthProvider to the provider hierarchy list in CLAUDE.md around line 52
2. Update line 54 to include all routes: Portfolio, MoxiLabs, Navigate, MoxiLabsEvents, MoxiLabsEventDetail, Layout
3. Add /api/auth to the backend routes list

### Suggested Improvements (Info)
1. Consider adding: Material-UI (MUI), React Router
2. Add command documentation to README.md: serve
3. Consider adding to README.md: REACT_APP_ENVIRONMENT


---

## Review Metrics

### Health Score: 88/100

**Score Breakdown**:
- Base Score: 100
- Critical Issues: -0 (0 × 10)
- Warnings: -9 (3 × 3)
- Info: -3 (3 × 1)
- **Final Score**: 88

### Category Breakdown

- **Docs**: 6 findings (0 critical, 3 warnings, 3 info)
