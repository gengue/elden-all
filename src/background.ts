import type { ActionType } from './platforms/base'
import { registry } from './platforms/registry'

interface MessagePayload {
    action: ActionType
    delay?: number
    hostname: string
    label?: string
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
