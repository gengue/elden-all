# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Elden All** is a Chrome extension that provides an "Elden Ring experience" for Git platforms (GitHub, GitLab, and self-hosted GitLab) by displaying fullscreen banners and playing sound effects when users perform actions (creating issues, merging PRs/MRs, closing issues, etc.).

## Build Commands

- **Development server**: `bun dev` (or `npm run dev`)
- **Build extension**: `bun run build` (or `npm run build`)
  - Compiles TypeScript and builds with Vite
  - Outputs to `dist/` directory
  - Creates `background.js`, `content.js`, and `options.js`

## Architecture

### Modular Multi-Platform Architecture

The extension uses a plugin-based architecture to support multiple Git platforms:

#### Core Components

1. **Platform Abstraction Layer** (`src/platforms/`)
   - `base.ts`: Abstract `Platform` class defining the interface for platform implementations
   - `registry.ts`: Central registry that detects and routes requests to appropriate platforms
   - Platform-specific implementations in subdirectories (e.g., `github/`, `gitlab/`)

2. **Platform Implementations**
   Each platform has three files:
   - `config.ts`: Platform-specific constants (URLs, action labels, delays)
   - `detector.ts`: Action detection logic for that platform's API patterns
   - `index.ts`: Main platform class implementing the `Platform` interface

3. **Background Service Worker** (`src/background.ts`)
   - Listens to HTTP requests via `chrome.webRequest` API
   - Uses `PlatformRegistry` to detect which platform is active
   - Delegates action detection to appropriate platform detector
   - Sends messages to content script with action, delay, and hostname

4. **Content Script** (`src/content.ts`)
   - Receives platform-aware messages from background worker
   - Displays fullscreen banners with Elden Ring-style images
   - Plays corresponding sound effects
   - Manages banner animations and timing

5. **Storage Layer** (`src/storage.ts`)
   - Manages user-configured custom GitLab domains via `chrome.storage.sync`
   - Provides CRUD operations for domain list

6. **Options Page** (`src/options.html`, `src/options.ts`)
   - Settings UI for adding/removing custom GitLab domains
   - Accessible via extension options in Chrome

### Platform Detection Flow

1. HTTP request intercepted by background worker
2. `PlatformRegistry.detectPlatform()` checks hostname against registered platforms
3. Platform's `matchesHost()` method returns true/false
4. If matched, platform's `detectAction()` is called
5. Platform detector analyzes URL patterns and request bodies
6. Returns action type and optional delay

### Action Types and Labels

All actions use unified type names (e.g., `prMade`, `issueCreated`) but each platform provides context-appropriate labels:
- GitHub: "Pull request made", "Repository created"
- GitLab: "Merge request made", "Project created"

Action types defined in `src/platforms/base.ts`:
- Issue actions: `issueCreated`, `issueClosed`, `issueReopened`, `issueCommented`, `issueNotPlanned`, `issueDuplicated`
- PR/MR actions: `prMade`, `prClosed`, `prReopened`, `prMerged`, `prCommented`
- Repo/Project actions: `repoCreated`, `repoDeleted`, `repoStarred`, `repoUnstarred`
- Other: `commentEdited`, `assignmentUpdated`, `codeReviewed`, `requestedChange`

### Platform-Specific Details

#### GitHub Platform (`src/platforms/github/`)
- GraphQL endpoint: `https://github.com/_graphql`
- REST endpoints: Various `/pull/`, `/repositories/`, etc.
- Uses form data for some PR actions
- Multi-stage detection with pending flags for `prMade` and `repoDeleted`

#### GitLab Platform (`src/platforms/gitlab/`)
- GraphQL endpoint: `/api/graphql` (relative to hostname)
- REST endpoints: `/api/v4/projects/`, `/api/v4/merge_requests/`, etc.
- Supports both gitlab.com and custom domains (via user settings)
- Multi-stage detection with pending flags for `mrMade` and `projectDeleted`

## Adding a New Platform

To add support for a new Git platform (e.g., Bitbucket):

1. Create `src/platforms/bitbucket/` directory
2. Implement `config.ts` with action labels and URL patterns
3. Implement `detector.ts` extending detection logic from `base.ts`
4. Implement `index.ts` extending `Platform` class
5. Register in `src/platforms/registry.ts` constructor
6. Update manifest.json `host_permissions` if needed

## Important Implementation Details

### Request Body Parsing

- GraphQL requests: Parsed as JSON from raw bytes in `Platform.readBody()`
- Form data requests: Converted from array format in `Platform.formDataPropertyArrayToLiteral()`

### Partial Shape Matching

The `Platform.partialShapeMatch()` method recursively checks if one object's structure exists within another, allowing detection of specific GraphQL mutations without matching entire request bodies.

### Animation Timing

- Banner fade-in: 1000ms
- Display duration: 3500ms total
- Banner fade-out: 1000ms
- Custom delays passed from platform detectors

## Build Configuration

- Uses Vite with rollup options for multi-entry builds
- Build is NOT minified (`minify: false`) for debugging
- TypeScript in strict mode with comprehensive linting rules
- Uses Bun as package manager (see `bun.lock`)

## Extension Structure

- `public/manifest.json`: Chrome extension manifest (Manifest V3)
- `public/banners/`: Fullscreen banner images (.webp)
- `public/sounds/`: Audio effects (.mp3)
- `public/assets/`: Extension icons
- `src/platforms/`: Platform abstraction and implementations
- `src/storage.ts`: Settings storage layer
- Build outputs `background.js`, `content.js`, and `options.html` to `dist/`
