import type { WebAppActionLabel } from '../base'

export const GMAIL_HOSTS = ['mail.google.com']

export const ACTION_LABELS: readonly WebAppActionLabel[] = [
    { action: 'emailSent', label: 'Email sent' },
    { action: 'inboxCleared', label: 'Inbox cleared' }
] as const

export const DELAYS = {
    emailSent: 1000,
    inboxCleared: 1000
} as const

// Gmail UI selectors (may need updating if Gmail changes their UI)
export const SELECTORS = {
    // Send button - multiple possible selectors for robustness
    sendButton: [
        'div[role="dialog"] button[aria-label*="Send"]',
        'div[role="dialog"] button[data-tooltip*="Send"]',
        'div.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3' // Classic Gmail send button class
    ],
    // Compose dialog
    composeDialog: 'div[role="dialog"]',
    // Archive/delete buttons
    archiveButton: 'div[aria-label*="Archive"]',
    deleteButton: 'div[aria-label*="Delete"]',
    // Inbox link - count is in aria-label attribute
    // Try multiple selectors to find the correct sidebar inbox link (not header)
    inboxLink: [
        'a.J-Ke[href*="#inbox"]', // Sidebar link with J-Ke class
        'a[aria-label*="Inbox"][href*="#inbox"]', // aria-label contains "Inbox"
        'nav a[href*="#inbox"]', // Link inside navigation
        'a[href*="mail/u/"][href*="#inbox"]:not([class*="gb_"])' // Exclude header links
    ]
} as const
