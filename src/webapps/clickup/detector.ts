import type { WebAppDetectionResult } from '../base'
import { SELECTORS, DELAYS } from './config'

export class ClickUpDetector {
    private inboxCountInterval: number | null = null
    private previousInboxCount: number | null = null
    private onActionDetected: (result: WebAppDetectionResult) => void

    constructor(onActionDetected: (result: WebAppDetectionResult) => void) {
        this.onActionDetected = onActionDetected
    }

    initialize(): void {
        this.setupInboxCountMonitor()
    }

    cleanup(): void {
        if (this.inboxCountInterval !== null) {
            clearInterval(this.inboxCountInterval)
            this.inboxCountInterval = null
        }
    }

    private setupInboxCountMonitor(): void {
        // Find the inbox button/badge element - try multiple selectors
        const findInboxBadgeElement = (): Element | null => {
            // First try to find badge directly
            for (const selector of SELECTORS.inboxBadge) {
                const element = document.querySelector(selector)
                if (element) {
                    return element
                }
            }

            // Fallback: find inbox button and look for badge inside
            for (const buttonSelector of SELECTORS.inboxButton) {
                const button = document.querySelector(buttonSelector)
                if (button) {
                    // Look for badge/count within button
                    const badge = button.querySelector('[class*="badge"], [class*="count"], span')
                    if (badge) return badge
                }
            }

            return null
        }

        // Get current inbox count from badge element
        const getInboxCount = (element: Element | null): number | null => {
            if (!element) return null

            // Try to get count from text content
            const text = element.textContent?.trim()
            if (text) {
                const match = text.match(/\d+/)
                if (match) return parseInt(match[0], 10)
            }

            // Try aria-label
            const ariaLabel = element.getAttribute('aria-label')
            if (ariaLabel) {
                const match = ariaLabel.match(/\d+/)
                if (match) return parseInt(match[0], 10)
            }

            // Try data attributes
            const dataCount = element.getAttribute('data-count') || element.getAttribute('data-value')
            if (dataCount) {
                const parsed = parseInt(dataCount, 10)
                if (!isNaN(parsed)) return parsed
            }

            // If badge exists but no count found, assume 0
            return 0
        }

        // Initialize with current count
        const initialElement = findInboxBadgeElement()
        this.previousInboxCount = getInboxCount(initialElement)

        // If inbox badge not found yet, retry after a delay
        if (!initialElement) {
            setTimeout(() => this.setupInboxCountMonitor(), 1000)
            return
        }

        // Poll for changes every 500ms
        // Uses polling because DOM changes might not trigger proper mutations
        this.inboxCountInterval = window.setInterval(() => {
            const element = findInboxBadgeElement()
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
