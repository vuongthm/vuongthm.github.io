# Contributing to Vuong's Blog Codebase

Thank you for your interest in contributing to the frontend and core engine of this website. This document outlines the guidelines for proposing changes to the Next.js codebase.

## Code of Conduct

Please be respectful, constructive, and helpful in all interactions. We aim to keep this workspace friendly and productive for everyone.

## How to Contribute

### 1. Local Setup

First, make sure you have pnpm installed on your machine.

1. Fork this repository on GitHub.
2. Clone your forked copy locally.
3. Install dependencies using the frozen lockfile:
   pnpm install --frozen-lockfile

### 2. Development & Synchronization

Our content database is decoupled. Since you will not have the private sibling folders on your local machine, the build script will automatically run fallbacks:

1. Run the dev command:
   pnpm dev
2. The compilation pipeline will automatically trigger and generate dummy asset placeholders inside the content directory.
3. Make your modifications to the components, styling, or layouts.

### 3. Coding Standards

- Keep components modular, accessible, and lightweight.
- Use native Tailwind CSS classes for styling.
- All code comments and pull request descriptions must be in English.
- Avoid introducing any unnecessary third-party npm packages.

### 4. Submitting a Pull Request

1. Create a new branch for your changes:
   git checkout -b feature/your-feature-name
2. Commit your changes with clear, descriptive commit messages.
3. Push to your forked repository.
4. Open a Pull Request pointing to the main branch of this repository.
5. Provide a detailed summary of what was changed and why.