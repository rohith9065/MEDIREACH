---
name: healthcare-security
description: Security rules for patient, hospital, ambulance, and admin workflows.
---

# Healthcare Security Skill

## Security principles
- Authenticate every request
- Authorize by role and ownership
- Never expose sensitive patient data unnecessarily
- Validate all inputs before processing
- Log important actions for auditability
- Restrict admin operations to authorized roles
- Enforce status and workflow checks

## Always validate
- User identity
- Role permissions
- Resource ownership
- Request data
- State transitions
- Sensitive fields before returning responses

## Sensitive data handling
- Patient records must be protected
- Medical data should be minimized in responses
- Only expose fields required for the task
- Do not log secrets or tokens

## Architecture
Apply security consistently across:
- API routes
- controllers
- services
- validators
- DB access

Do not bypass existing authorization or validation patterns.