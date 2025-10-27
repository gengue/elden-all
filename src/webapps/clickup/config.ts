import type { WebAppActionLabel } from '../base'

export const CLICKUP_HOSTS = ['app.clickup.com']

export const ACTION_LABELS: readonly WebAppActionLabel[] = [
    { action: 'inboxCleared', label: 'Inbox cleared' }
] as const

export const DELAYS = {
    inboxCleared: 1000
} as const

// ClickUp UI selectors (may need updating if ClickUp changes their UI)
// These are common patterns for notification badges - adjust after testing
export const SELECTORS = {
    // Inbox/notification button - try multiple selectors for robustness
    inboxButton: [
        '[data-test="inbox-button"]',
        'button[aria-label*="Inbox"]',
        'button[aria-label*="Notifications"]',
        '[class*="inbox"]',
        '[class*="notification"]'
    ],
    // Notification badge/count - common patterns
    inboxBadge: [
        '[data-test="inbox-button"] [class*="badge"]',
        'button[aria-label*="Inbox"] [class*="badge"]',
        '[class*="notification-badge"]',
        '[class*="inbox-count"]',
        'span[class*="count"]'
    ]
} as const
