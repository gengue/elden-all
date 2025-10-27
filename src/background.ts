import type { ActionType } from './platforms/base'
import { registry } from './platforms/registry'

interface MessagePayload {
    action: ActionType | string
    delay?: number
    hostname: string
    label?: string
    type?: string
}

function dispatch(
    action: ActionType,
    details:
        | chrome.webRequest.OnBeforeRequestDetails
        | chrome.webRequest.OnCompletedDetails,
    delay?: number
) {
    const tabId = details.tabId
    if (typeof tabId !== 'number' || !tabId) return

    const url = new URL(details.url)
    const label = registry.getActionLabel(url.hostname, action)

    const message: MessagePayload = {
        action,
        hostname: url.hostname,
        delay,
        label
    }

    chrome.tabs.sendMessage(tabId, message)
}

async function initialize() {
    await registry.initialize()

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes.eldenGithubSettings) {
            registry.refreshCustomDomains()
        }
    })

    // Listen for messages from content scripts (for WebApp actions)
    chrome.runtime.onMessage.addListener((message: MessagePayload, sender) => {
        if (message.type === 'webapp_action' && sender.tab?.id) {
            // Relay the webapp action back to the content script with proper formatting
            chrome.tabs.sendMessage(sender.tab.id, {
                action: message.action,
                delay: message.delay,
                hostname: message.hostname,
                label: message.label,
                type: 'webapp_action'
            })
        }
    })
}

initialize()

chrome.webRequest.onBeforeRequest.addListener(
    (detail) => {
        const result = registry.detectAction(
            {
                url: detail.url,
                method: detail.method,
                requestBody: detail.requestBody
            },
            'before'
        )

        if (result) {
            dispatch(result.action, detail, result.delay)
        }

        return undefined
    },
    { urls: ['https://github.com/*', 'https://gitlab.com/*', 'https://*/*'] },
    ['requestBody']
)

chrome.webRequest.onCompleted.addListener(
    (detail) => {
        const result = registry.detectAction(
            {
                url: detail.url,
                method: detail.method
            },
            'completed'
        )

        if (result) {
            dispatch(result.action, detail, result.delay)
        }

        return undefined
    },
    { urls: ['https://github.com/*', 'https://gitlab.com/*', 'https://*/*'] }
)

