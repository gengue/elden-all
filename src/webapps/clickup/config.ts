import type { WebAppActionLabel } from '../base'

export const CLICKUP_HOSTS = ['app.clickup.com']

export const ACTION_LABELS: readonly WebAppActionLabel[] = [
    { action: 'inboxCleared', label: 'Inbox cleared' }
] as const

export const DELAYS = {
    inboxCleared: 1000
} as const

// ClickUp UI selectors (may need updating if ClickUp changes their UI)
// Monitor the actual inbox VIEW/PAGE, not just notification badge
export const SELECTORS = {
    // Inbox view/container - the inbox page itself
    inboxView: [
        'cu3-notifications-top-header',
        'cu3-notifications-list',
        '[class*="notifications-context-menu"]',
        '[data-test="inbox-view"]',
        '[class*="inbox-view"]'
    ],
    // Inbox items list container
    inboxItemsList: [
        'cu3-notifications-list-layout',
        'cu3-notification-bundle',
        '[class*="notifications-list-layout"]',
        '[data-test="inbox-list"]'
    ],
    // Individual inbox items (to count them)
    // ClickUp uses custom Angular elements: cu3-notification-row-layout
    inboxItem: [
        'cu3-notification-row-layout',
        '[class*="cu-notification-row-layout"]',
        '[data-pendo*="first-bundle-row"]'
    ],
    // Empty state indicator (when inbox is empty)
    // When empty: scrollable_empty, list-layout_empty, inner_empty classes appear
    emptyState: [
        'cu3-empty-state',
        '[class*="scrollable_empty"]',
        '[class*="list-layout_empty"]',
        '[class*="inner_empty"]',
        '[class*="ng-trigger-loadingEnter"]'
    ]
} as const
