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
        // Check if we're in the inbox view
        const isInInboxView = (): boolean => {
            const inUrl = window.location.href.includes('/inbox')

            for (const selector of SELECTORS.inboxView) {
                if (document.querySelector(selector)) {
                    return true
                }
            }

            return inUrl
        }

        // Get count of inbox items
        const getInboxItemCount = (): number | null => {
            // Strategy 1: Count individual inbox items
            for (const selector of SELECTORS.inboxItem) {
                const items = document.querySelectorAll(selector)
                if (items.length > 0) {
                    return items.length
                }
            }

            // Strategy 2: Check for empty state
            for (const selector of SELECTORS.emptyState) {
                const emptyElement = document.querySelector(selector)
                if (emptyElement) {
                    return 0
                }
            }

            // Strategy 3: Check inbox list container
            for (const selector of SELECTORS.inboxItemsList) {
                const list = document.querySelector(selector)
                if (list) {
                    const childCount = list.children.length
                    if (childCount > 0) return childCount
                    return 0
                }
            }

            return null
        }

        // Check if in inbox view initially
        if (!isInInboxView()) {
            setTimeout(() => this.setupInboxCountMonitor(), 2000)
            return
        }

        // Get initial count
        this.previousInboxCount = getInboxItemCount()

        // If can't determine count yet, retry
        if (this.previousInboxCount === null) {
            setTimeout(() => this.setupInboxCountMonitor(), 1000)
            return
        }

        // Poll for changes every 500ms
        this.inboxCountInterval = window.setInterval(() => {
            // Re-check if still in inbox view
            if (!isInInboxView()) {
                this.cleanup()
                return
            }

            const currentCount = getInboxItemCount()

            // Only process if we can determine count
            if (currentCount === null) return

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
