import type { WebApp, WebAppActionType } from './base'
import { GmailWebApp } from './gmail'
import { ClickUpWebApp } from './clickup'

export class WebAppRegistry {
    private webapps: WebApp[] = []
    private activeWebApp: WebApp | undefined

    constructor() {
        this.registerWebApp(new GmailWebApp())
        this.registerWebApp(new ClickUpWebApp())
    }

    private registerWebApp(webapp: WebApp): void {
        this.webapps.push(webapp)
    }

    detectWebApp(hostname: string): WebApp | undefined {
        return this.webapps.find((app) => app.matchesHost(hostname))
    }

    initializeForHost(hostname: string): void {
        const webapp = this.detectWebApp(hostname)
        if (webapp && webapp !== this.activeWebApp) {
            // Cleanup previous webapp if different
            if (this.activeWebApp) {
                this.activeWebApp.cleanup()
            }
            this.activeWebApp = webapp
            webapp.initialize()
        }
    }

    cleanup(): void {
        if (this.activeWebApp) {
            this.activeWebApp.cleanup()
            this.activeWebApp = undefined
        }
    }

    getActionLabel(hostname: string, action: WebAppActionType): string | undefined {
        const webapp = this.detectWebApp(hostname)
        if (!webapp) return undefined

        return webapp.getActionLabel(action)
    }
}
