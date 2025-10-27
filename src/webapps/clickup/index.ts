import { WebApp, type WebAppActionType, type WebAppDetectionResult } from '../base'
import { CLICKUP_HOSTS, ACTION_LABELS } from './config'
import { ClickUpDetector } from './detector'

export class ClickUpWebApp extends WebApp {
    readonly name = 'clickup'
    readonly displayName = 'ClickUp'

    private detector: ClickUpDetector | null = null

    matchesHost(hostname: string): boolean {
        return CLICKUP_HOSTS.includes(hostname)
    }

    initialize(): void {
        // Create detector with callback to send messages to background
        this.detector = new ClickUpDetector((result: WebAppDetectionResult) => {
            this.dispatchAction(result)
        })

        this.detector.initialize()
    }

    cleanup(): void {
        if (this.detector) {
            this.detector.cleanup()
            this.detector = null
        }
    }

    getActionLabel(action: WebAppActionType): string {
        const actionLabel = ACTION_LABELS.find((label) => label.action === action)
        return actionLabel?.label ?? action
    }

    private dispatchAction(result: WebAppDetectionResult): void {
        const label = this.getActionLabel(result.action)

        // Send message to background script
        chrome.runtime.sendMessage({
            type: 'webapp_action',
            action: result.action,
            delay: result.delay,
            hostname: window.location.hostname,
            label
        })
    }
}
