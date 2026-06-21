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

## 🎯 Overview & Background

### What is glide.?
glide. is a powerful, self-hosted platform built to streamline the localization of your digital products. It provides a beautiful interface to manage translation keys, labels, and multiple languages across various projects. With built-in AI translation capabilities and robust backup systems, it takes the heavy lifting out of managing multi-language applications.

### The Story Behind It
**glide.** started out as a passion project—mostly "vibecoded" for fun to explore modern technologies and AI-assisted development paradigms. However, despite being born out of curiosity, an immense amount of effort went into engineering the prompts, crafting a rock-solid project structure, brainstorming features, and ensuring robust security practices. The result is a system that is not just an experiment, but completely secure, stable, and **ready to be used in production environments.**

## 🚀 Features

- **Centralized Translation Hub:** Manage keys, values, and language files for unlimited projects.
- **Auto-Translation via API:** Integrated deeply with DeepL and Google Translate for instant context-aware translations.
- **Custom Whitelabeling:** Personalize the entire platform with your own logo, branding, and color schemes.
- **Enterprise Ready Auth:** Out-of-the-box OpenID Connect (OIDC) support for secure SSO.
- **Automated S3 Backups:** Cronjob-powered JSON backups of your localization data directly to AWS/MinIO.
- **Team & Quota Management:** Fine-grained access control, user roles, and translation quotas.
- **Blazing Fast:** Powered end-to-end by the Bun runtime, Fastify, and Nuxt.

---

## 🏗 Tech Stack

glide. is structured as a **Monorepo** (powered by Turborepo) and uses the modern JavaScript ecosystem:

- **Runtime & Package Manager:** [Bun](https://bun.sh/)
- **Frontend (`apps/frontend`):** [Nuxt](https://nuxt.com/) (Vue.js) + Tailwind CSS / Nuxt UI
- **Backend (`apps/backend`):** [Fastify](https://fastify.dev/) + TypeScript
- **Database / ORM:** [SQLite](https://sqlite.org/) + [Drizzle ORM](https://orm.drizzle.team/)
- **Deployment:** Multi-stage Docker + Docker Compose

---

## 🛠 Getting Started (Local Development)

### 1. Prerequisites
You need to have **[Bun](https://bun.sh/)** installed on your machine.

### 2. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/marl0nx/glidedot.git
cd glidedot

# Install dependencies for both frontend and backend
bun install
```

### 3. Run the Dev Servers
You can start both the frontend and the backend simultaneously using Turbo:
```bash
# From the root directory
bun run dev
```
- **Frontend** will be running at `http://localhost:3000`
- **Backend API** will be running at `http://localhost:3001`

---

## 🐳 Docker Deployment (Production)

Deploying glide. is incredibly easy thanks to the included `docker-compose.yml`. We do not use `.env` files—all configuration is done directly via Docker Compose.

1. Open `docker-compose.yml` and insert your OIDC, DeepL, and S3 credentials into the `environment` blocks.
2. Build and start the containers in detached mode:

```bash
docker-compose up -d --build
```

### What happens under the hood?
- **Frontend Container:** Builds a standalone Nuxt Nitro server using a multi-stage process for minimal image size.
- **Backend Container:** Runs the Fastify API natively using the lightweight `oven/bun:1-alpine` image.
- **Persistent Data:** A Docker volume (`glide_data`) is created automatically to ensure your SQLite database remains untouched between container restarts.

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
