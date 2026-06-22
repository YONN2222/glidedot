<div align="center">
  <h1>✨ glide.</h1>
  <p><strong>A blazing fast, modern localization & translation management platform.</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun" />
    <img src="https://img.shields.io/badge/Nuxt-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white" alt="Nuxt" />
    <img src="https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  </p>
</div>

<br />

## 💡 Overview

### What is glide.?
glide. is an enterprise-grade, self-hosted localization and translation management platform. It provides a highly optimized interface to manage translation keys, labels, conventions, and multiple languages across various projects. Designed for modern development workflows, it takes the heavy lifting out of managing multi-language applications through robust APIs and automated pipelines.

### Built for Production
Engineered from the ground up with a focus on security, data integrity, and performance, glide. is designed to be the single source of truth for your organization's localized content. It features a rock-solid architecture leveraging SQLite and Fastify, ensuring high throughput and reliability. With features like strict Naming Conventions, an integrated Translation Review System, and automated S3 disaster recovery, the platform is ready to be deployed in mission-critical production environments.

### AI-Assisted, Human Engineered
While **glide.** was brought to life with heavy assistance from modern AI coding agents, it is far from a simple generated prototype. An immense amount of human effort went into architectural planning, prompt engineering, and security design. Every feature—from the strictly typed database schemas to the UI micro-interactions—was meticulously guided to ensure the resulting platform is robust, secure, and truly ready for production environments.

## 💎 Core Features

- **In-Context Editor:** Edit translations live and visually directly inside your target application using the Glide overlay.
- **Naming Conventions & Linting:** Enforce strict key structures via visual Templates, shared Variables, and a global Glossary Linter.
- **Translation Review System:** Ensure maximum quality by routing new translations through a strict drafting and approval workflow.
- **Activity Logs & Heatmap:** Track every single action on the platform, beautifully visualized in a GitHub-style productivity heatmap.
- **Auto-Translation via AI:** Integrated deeply with DeepL and Google Translate for instant, context-aware translation suggestions.
- **Enterprise Ready:** Out-of-the-box OpenID Connect (OIDC) for secure SSO and automated S3 Backups for disaster recovery.
- **Fine-grained Access Control:** Manage teams, user roles (Admins, Reviewers), and set monthly translation quotas.
- **Blazing Fast:** Powered end-to-end by the Bun runtime, Fastify, and Nuxt.

---

## ⚙️ Tech Stack

glide. is structured as a **Monorepo** (powered by Turborepo) and uses the modern JavaScript ecosystem:

- **Runtime & Package Manager:** [Bun](https://bun.sh/)
- **Frontend (`apps/frontend`):** [Nuxt](https://nuxt.com/) (Vue.js) + Tailwind CSS / Nuxt UI
- **Backend (`apps/backend`):** [Fastify](https://fastify.dev/) + TypeScript
- **Database / ORM:** [SQLite](https://sqlite.org/) + [Drizzle ORM](https://orm.drizzle.team/)
- **Deployment:** Multi-stage Docker + Docker Compose

---

## 📚 Documentation

Dive into our comprehensive guides to learn how to deploy, configure, and use all the powerful features glide has to offer:

- [**Installation & Deployment**](docs/INSTALL.md) — Learn how to run glide locally or deploy it in production using Docker.
- [**In-Context Editing**](docs/IN-CONTEXT-EDIT.md) — Set up live visual editing directly inside your target applications.
- [**Key Conventions & Templates**](docs/CONVENTIONS.md) — Enforce strict naming rules using templates, global variables, and glossary linting.
- [**The Review System**](docs/REVIEWS.md) — Understand how the drafting, approval, and rejection lifecycle works for translations.
- [**Migration & Backups**](docs/MIGRATION.md) — Import/Export your translations and configure automated disaster recovery via S3.
- [**Theming & UI Customization**](docs/THEMING.md) — Learn about our Nuxt UI customizations and our premium dark mode philosophy.

---

## 📂 Repository Structure

```text
glidedot/
├── apps/
│   ├── backend/        # Fastify API, Drizzle ORM schemas, Cron jobs
│   └── frontend/       # Nuxt App, Pages, UI Components
├── docker-compose.yml  # Production Orchestration
├── turbo.json          # Monorepo pipeline configuration
└── bun.lockb           # Lockfile (DO NOT DELETE)
```

---

<div align="center">
  <i>Built with ❤️ by marl0nx</i>
</div>
