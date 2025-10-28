import type { WebAppDetectionResult } from '../base'
import { SELECTORS, DELAYS } from './config'

export class ClickUpDetector {
    private inboxCountInterval: number | null = null
    private previousInboxCount: number | null = null
    private taskStatusClickHandler: ((event: Event) => void) | null = null
    private onActionDetected: (result: WebAppDetectionResult) => void

    constructor(onActionDetected: (result: WebAppDetectionResult) => void) {
        this.onActionDetected = onActionDetected
    }

    initialize(): void {
        this.setupInboxCountMonitor()
        this.setupTaskStatusClickDetector()
    }

    cleanup(): void {
        if (this.inboxCountInterval !== null) {
            clearInterval(this.inboxCountInterval)
            this.inboxCountInterval = null
        }
        if (this.taskStatusClickHandler !== null) {
            document.removeEventListener('click', this.taskStatusClickHandler)
            this.taskStatusClickHandler = null
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

    private setupTaskStatusClickDetector(): void {
        // Helper function to check if clicked element is a done status menu item
        const isDoneStatusMenuItem = (element: Element | null): boolean => {
            if (!element) return false

            // Check data-test attribute for done status indicators
            const dataTest = element.getAttribute('data-test')
            if (dataTest) {
                // Match patterns like: status-list__done, status-list__closed, status-list__complete
                const donePatterns = ['done', 'closed', 'complete', 'completed', 'finished', 'resolved']
                for (const pattern of donePatterns) {
                    if (dataTest.includes(`status-list__${pattern}`) || dataTest.includes(`status__${pattern}`)) {
                        return true
                    }
                }
            }

            // Check class names for done status menu items
            const className = element.className
            if (className && typeof className === 'string') {
                // Must be a menu item
                if (className.includes('menu-item') || className.includes('status-list-menu-item')) {
                    // Check if it's a done status
                    const lowerClass = className.toLowerCase()
                    const doneKeywords = ['closed', 'done', 'complete', 'completed', 'finished', 'resolved']
                    for (const keyword of doneKeywords) {
                        if (lowerClass.includes(keyword)) {
                            return true
                        }
                    }
                }
            }

            // Check text content as last resort
            const textContent = element.textContent?.trim().toLowerCase()
            if (textContent) {
                const doneTexts = ['closed', 'done', 'complete', 'completed', 'finished', 'resolved']
                // Must be short text (not a long description) and be a menu item
                if (textContent.length < 20 && className && className.includes('menu-item')) {
                    for (const text of doneTexts) {
                        if (textContent === text) {
                            return true
                        }
                    }
                }
            }

            return false
        }

        // Click event handler
        this.taskStatusClickHandler = (event: Event) => {
            const target = event.target as Element

            // Check if the clicked element is a done status menu item
            if (isDoneStatusMenuItem(target)) {
                this.onActionDetected({
                    action: 'taskDone',
                    delay: DELAYS.taskDone
                })
                return
            }

            // Also check parent elements (up to 3 levels) in case user clicked on text/icon inside menu item
            let parent = target.parentElement
            let depth = 0
            while (parent && depth < 3) {
                if (isDoneStatusMenuItem(parent)) {
                    this.onActionDetected({
                        action: 'taskDone',
                        delay: DELAYS.taskDone
                    })
                    return
                }
                parent = parent.parentElement
                depth++
            }
        }

        // Add click event listener to document
        document.addEventListener('click', this.taskStatusClickHandler)
    }
}
