# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Elden All** is a Chrome extension that provides an "Elden Ring experience" for Git platforms (GitHub, GitLab, and self-hosted GitLab) and web applications (Gmail) by displaying fullscreen banners and playing sound effects when users perform actions (creating issues, merging PRs/MRs, sending emails, etc.).

## Build Commands

- **Development server**: `bun dev` (or `npm run dev`)
- **Build extension**: `bun run build` (or `npm run build`)
  - Compiles TypeScript and builds with Vite
  - Outputs to `dist/` directory
  - Creates `background.js`, `content.js`, and `options.js`

## Architecture

### Dual-Architecture System

The extension uses two parallel plugin-based architectures:
1. **Platform Architecture** - Network-based detection for Git platforms (GitHub, GitLab)
2. **WebApp Architecture** - DOM-based detection for web applications (Gmail)

### Platform Architecture (Network-Based)

Used for Git platforms where actions are detected via HTTP request interception:

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
   - Listens to HTTP requests via `chrome.webRequest` API (for Git platforms)
   - Uses `PlatformRegistry` to detect which platform is active
   - Delegates action detection to appropriate platform detector
   - Relays messages from WebApp content scripts (for DOM-based detections)
   - Sends messages to content script with action, delay, and hostname

4. **Content Script** (`src/content.ts`)
   - Initializes `WebAppRegistry` for DOM-based detection
   - Receives messages from background worker (both network and DOM-based)
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

### WebApp Architecture (DOM-Based)

Used for web applications where actions are detected via DOM observation:

#### Core Components

1. **WebApp Abstraction Layer** (`src/webapps/`)
   - `base.ts`: Abstract `WebApp` class defining the interface for webapp implementations
   - `registry.ts`: Central registry that manages webapp initialization
   - WebApp-specific implementations in subdirectories (e.g., `gmail/`)

2. **WebApp Implementations**
   Each webapp has three files:
   - `config.ts`: WebApp-specific constants (selectors, action labels, delays)
   - `detector.ts`: DOM-based detection using MutationObserver and event listeners
   - `index.ts`: Main webapp class implementing the `WebApp` interface

3. **Detection Flow**
   - Content script initializes `WebAppRegistry` on page load
   - Registry detects hostname and initializes appropriate WebApp
   - WebApp sets up DOM observers and event listeners
   - When action detected, sends message to background worker
   - Background worker relays message back to content script for banner display

#### Gmail WebApp (`src/webapps/gmail/`)
- Hostname: `mail.google.com`
- Actions supported:
  - `emailSent` - DOM-based detection via click event listeners on Send button
  - `inboxCleared` - Polling-based detection (checks every 500ms)
- **Email Sent Detection:**
  - Monitors click events on compose dialog send buttons
  - Multiple selectors for robustness across Gmail versions
  - Triggers immediately when user clicks Send
- **Inbox Cleared Detection:**
  - Polls inbox link's `aria-label` attribute every 500ms
  - Extracts count from patterns like "Inbox N unread"
  - Triggers when count changes from N (> 0) → 0
  - Uses polling instead of MutationObserver (Gmail doesn't properly trigger attribute mutations)
  - Language-agnostic (works with any Gmail language)
- Uses MutationObserver to watch for compose dialog changes (for email sent)

#### ClickUp WebApp (`src/webapps/clickup/`)
- Hostname: `app.clickup.com`
- Actions supported:
  - `inboxCleared` - Polling-based detection (checks every 500ms)
  - `taskDone` - Click event detection (user clicks done status in dropdown)
- **Inbox Cleared Detection:**
  - Polls inbox item count in the inbox view every 500ms
  - Multiple selectors to find inbox items and empty states
  - Extracts count from DOM elements (inbox items, empty state indicators)
  - Triggers when count changes from N (> 0) → 0
  - Uses polling for reliability (similar to Gmail approach)
  - Retries if elements not found initially (1s/2s delays)
- **Task Done Detection:**
  - Listens for click events on status dropdown menu items
  - Detects clicks on done status options via `data-test` attributes (e.g., `status-list__done`, `status-list__closed`)
  - Also checks class names and text content as fallbacks
  - Traverses up to 3 parent levels to handle clicks on icons/text inside menu items
  - Only triggers when user explicitly clicks a done status option (no false triggers from page loads or dropdown opens)
  - Simple, direct user intent detection approach

## Adding New Platforms/WebApps

### Adding a New Git Platform (e.g., Bitbucket)

1. Create `src/platforms/bitbucket/` directory
2. Implement `config.ts` with action labels and URL patterns
3. Implement `detector.ts` extending detection logic from `base.ts`
4. Implement `index.ts` extending `Platform` class
5. Register in `src/platforms/registry.ts` constructor
6. Update manifest.json `host_permissions` if needed

### Adding a New WebApp (e.g., Outlook, Slack)

1. Create `src/webapps/outlook/` directory
2. Implement `config.ts` with action labels, DOM selectors, and delays
3. Implement `detector.ts` with DOM-based detection (MutationObserver, event listeners)
4. Implement `index.ts` extending `WebApp` class
5. Register in `src/webapps/registry.ts` constructor
6. Add actions to `src/content.ts` banners and sounds mappings
7. Create banner images in `public/banners/`
8. Update manifest.json `host_permissions` and `content_scripts.matches`

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
- `src/platforms/`: Platform abstraction and implementations (network-based)
- `src/webapps/`: WebApp abstraction and implementations (DOM-based)
- `src/storage.ts`: Settings storage layer
- Build outputs `background.js`, `content.js`, and `options.html` to `dist/`

## Banner Images

Banner images are fullscreen Elden Ring-style victory messages displayed when actions are completed.

### Creating New Banners

**Image Generator Tool:** https://rezuaq.be/new-area/image-creator/

This fan-made tool recreates the Elden Ring "NEW AREA" message style. To create custom banners:

1. Visit the image creator tool
2. Enter your custom text (e.g., "EMAIL SENT", "INBOX CLEARED", "PULL REQUEST MERGED")
3. Choose text color (yellow, red, white, etc.)
4. Download the PNG image
5. Convert to WebP format with high quality:
   ```bash
   magick input.png -quality 95 output.webp
   ```
6. Place in `public/banners/` directory
7. Add to banners mapping in `src/content.ts`

### Image Specifications
- **Format:** WebP (for smaller file size)
- **Quality:** 95 (high quality to preserve text clarity)
- **Typical size:** 20-30 KB per banner
- **Dimensions:** Original dimensions from generator (typically ~1920x1080)

### Current Banners
All banner images in `public/banners/` follow this format and are generated using the tool above.

## Action Types

### Git Platform Actions
Defined in `src/platforms/base.ts`:
- Issue actions: `issueCreated`, `issueClosed`, `issueReopened`, `issueCommented`, `issueNotPlanned`, `issueDuplicated`
- PR/MR actions: `prMade`, `prClosed`, `prReopened`, `prMerged`, `prCommented`
- Repo/Project actions: `repoCreated`, `repoDeleted`, `repoStarred`, `repoUnstarred`
- Other: `commentEdited`, `assignmentUpdated`, `codeReviewed`, `requestedChange`

### WebApp Actions
Defined in `src/webapps/base.ts`:
- Gmail: `emailSent`, `inboxCleared` (both fully implemented)
- ClickUp: `inboxCleared`, `taskDone` (both fully implemented)
