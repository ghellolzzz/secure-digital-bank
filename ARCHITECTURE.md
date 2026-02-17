# Architecture & Technology Decisions

## Database: PostgreSQL (via Neon DB)
**Decision:** We have selected **PostgreSQL 15** (Serverless via Neon) as the primary data store.

**Justification for Banking:**
1.  **ACID Compliance:** Neon is fully PostgreSQL compatible, preserving all ACID guarantees required for financial transactions.
2.  **Serverless & Cloud-Native:** Removes the need for local Docker management, making the project easier to run and deploy.
3.  **Branching:** Neon's branching feature (copy-on-write) allows us to instantly create test environments with production-like data, excellent for testing schema migrations safely.
4.  **Data Integrity:** We leverage PostgreSQL's robust constraint system (CHECK, FOREIGN KEY) which Neon supports natively.
5.  **Numeric Precision:** Full support for the `NUMERIC` data type.

## Backend: Node.js + Express
**Decision:** Node.js with Express.

**Justification:**
- **Non-blocking I/O:** Excellent for handling multiple concurrent network requests (high I/O), typical in API gateways.
- **Ecosystem:** Vast library support for security (bcrypt, helmet) and utilities.
- **Maintainability:** Express offers a clear middleware pattern for separating concerns like authentication, validation, and error handling.

## Systems Thinking: Cloud Database
**Decision:** Use a managed Cloud Database (Neon).

**Justification:**
- **Modern Infrastructure:** Demonstrates understanding of modern, serverless architectures.
- **Accessibility:** Database is accessible from any environment (local, Vercel, etc.) without networking headaches.
