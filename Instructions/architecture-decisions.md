# Architecture Decisions

## Purpose
This file is the canonical source of truth for architecture choices used across this plan.
If any other document conflicts with this file, this file takes precedence.

## Locked Decisions
- Frontend: React + Vite (default)
- Backend: Node.js + Express (default)
- Database: MySQL (default)
- Auth Mode: session (default)
- API Style: session
- RBAC: admin-user
- user_business_map required: no
- Product table name: products
- Storage path: /var/www/storage/uploads/{resource}/{yyyy}/{uuid}.{ext}

## Source Priority
1. User prompt requirements
2. This architecture-decisions.md file
3. requirements.md and prd.md
4. techstack.md, backend.md, frontend.md, api-docs.md, database.md, security.md, flow.md, status.md

## Consistency Contract
- Do not introduce alternative stacks beyond the locked decisions.
- Keep auth, API style, table names, and storage paths consistent in every document and implementation.
- Keep naming and terminology stable across files.

## User Requirements Snapshot
I need a single, detailed paragraph prompt to instruct an AI to design a premium, SaaS-style user interface and experience for a [WEPAPP], emphasizing clarity, elegance, and efficiency. The design should feel modern and high-end, using a refined color palette, strong typography hierarchy, generous spacing, and a consistent component-based design system. Layouts should be dashboard-driven with well-structured sidebars, top navigation, cards, tables, and modals, supporting complex workflows while remaining intuitive. Include smooth purposeful micro-interactions and subtle animations to enhance usability and feedback without distraction. The experience should be fully responsive, accessibility-aware, and optimize for productivity, covering all key screens and state such as onboarding, authentication, dashboards, settings, data views, empty states, loading states, and error handling, resulting in polished, enterprise-ready SaaS product. 
WEPAPP=Ecommerce site for selling refined plastic product, metal scraps and discarded fabrics
