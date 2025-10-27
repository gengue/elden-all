import type { WebAppDetectionResult } from '../base'
import { SELECTORS, DELAYS } from './config'

export class GmailDetector {
    private observer: MutationObserver | null = null
    private inboxCountInterval: number | null = null
    private previousInboxCount: number | null = null
    private onActionDetected: (result: WebAppDetectionResult) => void

    constructor(onActionDetected: (result: WebAppDetectionResult) => void) {
        this.onActionDetected = onActionDetected
    }

    initialize(): void {
        // Set up click listener for send button
        this.setupSendButtonListener()

        // Watch for new compose dialogs appearing
        this.observeForNewComposeDialogs()

        // Set up inbox count monitoring
        this.setupInboxCountMonitor()
    }

    cleanup(): void {
        if (this.observer) {
            this.observer.disconnect()
            this.observer = null
        }
        if (this.inboxCountInterval !== null) {
            clearInterval(this.inboxCountInterval)
            this.inboxCountInterval = null
        }
        // Remove event listeners
        document.removeEventListener('click', this.handleClick)
    }

    private setupSendButtonListener(): void {
        // Add click listener to document to catch send button clicks
        document.addEventListener('click', this.handleClick, true)
    }

    private handleClick = (event: MouseEvent): void => {
        const target = event.target as HTMLElement

        // Check if the clicked element or its parents match send button selectors
        for (const selector of SELECTORS.sendButton) {
            if (target.matches(selector) || target.closest(selector)) {
                // Check if we're in a compose dialog
                const composeDialog = target.closest(SELECTORS.composeDialog)
                if (composeDialog) {
                    this.onActionDetected({
                        action: 'emailSent',
                        delay: DELAYS.emailSent
                    })
                    break
                }
            }
        }
    }

    private observeForNewComposeDialogs(): void {
        // Watch for new compose dialogs being added to the DOM
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof HTMLElement) {
                            // Check if a compose dialog was added
                            if (node.matches(SELECTORS.composeDialog) ||
                                node.querySelector(SELECTORS.composeDialog)) {
                                // Dialog is ready, our click listener will handle send button
                            }
                        }
                    })
                }
            }
        })

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        })
    }

    private setupInboxCountMonitor(): void {
        // Find the inbox link element - try multiple selectors
        const findInboxLinkElement = (): HTMLAnchorElement | null => {
            const selectors = Array.isArray(SELECTORS.inboxLink)
                ? SELECTORS.inboxLink
                : [SELECTORS.inboxLink]

            for (const selector of selectors) {
                const element = document.querySelector<HTMLAnchorElement>(selector)
                if (element) {
                    return element
                }
            }
            return null
        }

        // Get current inbox count from aria-label attribute
        const getInboxCount = (element: HTMLAnchorElement | null): number | null => {
            if (!element) return null

            const ariaLabel = element.getAttribute('aria-label')
            if (!ariaLabel) return null

            // Extract number from aria-label
            const match = ariaLabel.match(/\d+/)
            return match ? parseInt(match[0], 10) : 0
        }

        // Initialize with current count
        const initialElement = findInboxLinkElement()
        this.previousInboxCount = getInboxCount(initialElement)

        // If inbox link not found yet, retry after a delay
        if (!initialElement) {
            setTimeout(() => this.setupInboxCountMonitor(), 1000)
            return
        }

        // Poll for changes every 500ms
        // Note: MutationObserver doesn't work because Gmail doesn't properly
        // trigger attribute mutations when aria-label changes
        this.inboxCountInterval = window.setInterval(() => {
            const element = findInboxLinkElement()
            const currentCount = getInboxCount(element)

            if (currentCount !== this.previousInboxCount) {
                // Trigger banner when inbox goes from N > 0 to 0
                if (
                    this.previousInboxCount !== null &&
                    this.previousInboxCount > 0 &&
                    currentCount === 0
                ) {
                    this.onActionDetected({
                        action: 'inboxCleared',
                        delay: DELAYS.inboxCleared
                    })
                }

                this.previousInboxCount = currentCount
            }
        }, 500)
    }
}
