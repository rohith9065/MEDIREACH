# Agent Security Guidelines & Policy

This document defines the security directives, rules, and guidelines for AI agents and developers operating within the **MediReach** repository.

---

## 1. Secrets & Credentials Management
- **Never Commit Secrets**: Do not commit secrets, API keys, private keys, database passwords, or JWT secret keys.
- **Environment Variables**: Store sensitive configuration in `.env` (which must be ignored in `.gitignore`). Always use `.env.example` to declare required environment keys with non-sensitive placeholder values.
- **No Hardcoded Tokens**: Never hardcode JWT tokens, API keys, or database URIs in application source files or seed scripts.

---

## 2. Authentication & Authorization (RBAC)
- **Token Verification**: Ensure all protected HTTP routes enforce valid JWT verification via authorization middleware.
- **Strict Role-Based Access Control**: Verify explicit user roles (`SUPER_ADMIN`, `HOSPITAL_ADMIN`, `PATIENT`, `AMBULANCE_DRIVER`) before granting access to sensitive resources or performing state-changing operations.
- **Least Privilege Principle**: Restrict access to database endpoints and admin portals to authorized roles only.

---

## 3. Data Protection & Privacy (PII / PHI)
- **Synthetic Demo Data**: Use synthetic mock data for development, seed scripts, and automated testing. Real hospital operational metrics, bed availability, or patient health data must never be hardcoded or logged in plaintext.
- **Log Hygiene**: Ensure sensitive data (passwords, tokens, PII) is stripped or redacted from application logs and console outputs.

---

## 4. Input Validation & SQL Security
- **Zod Schema Validation**: Validate all incoming HTTP request payloads (`req.body`, `req.query`, `req.params`) using Zod schemas before passing them to controllers or services.
- **Parameterized SQL Queries**: Always use parameterized placeholders (`$1`, `$2`, etc.) with `pg` for database queries. **Never** use string interpolation or concatenation to construct raw SQL queries.
- **Sanitization**: Protect frontend and backend rendering from Cross-Site Scripting (XSS) and injection attacks.

---

## 5. Agent Operational Boundaries
- **Safe Shell Execution**: Do not execute destructive or irreversible CLI commands (e.g., dropping production database tables, deleting repository root files, or force-pushing git branches) without explicit user confirmation.
- **Dependency Vetting**: Always check dependencies before adding new npm packages to avoid supply chain vulnerabilities.
