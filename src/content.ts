const banners = {
	'assignmentUpdated': 'banners/assignment-updated.webp',
    codeReviewed: 'banners/code-reviewed.webp',
    commentEdited: 'banners/comment-edited.webp',
    issueClosed: 'banners/issue-closed.webp',
    issueCommented: 'banners/issue-commented.webp',
    issueCreated: 'banners/issue-created.webp',
    issueDuplicated: 'banners/issue-duplicated.webp',
    issueNotPlanned: 'banners/issue-not-planned.webp',
    issueReopened: 'banners/issue-reopened.webp',
    prCommented: 'banners/pull-request-commented.webp',
    prClosed: 'banners/pull-request-closed.webp',
    prMade: 'banners/pull-request-made.webp',
    prMerged: 'banners/pull-request-merged.webp',
    prReopened: 'banners/pull-request-reopened.webp',
    repoCreated: 'banners/repository-created.webp',
    repoDeleted: 'banners/repository-deleted.webp',
    repoStarred: 'banners/repository-starred.webp',
    repoUnstarred: 'banners/repository-unstarred.webp',
    requestedChange: 'banners/requested-change.webp',
    emailSent: 'banners/email-sent.webp',
    inboxCleared: 'banners/inbox-cleared.webp',
    taskDone: 'banners/task-done.webp'
} as const

export type Actions = keyof typeof banners

const sounds = {
    newItem: 'sounds/new-item.mp3',
    enemyFailed: 'sounds/enemy-failed.mp3'
} as const

const bannerSounds = {
	assignmentUpdated: 'newItem',
    codeReviewed: 'newItem',
    commentEdited: 'newItem',
    issueClosed: 'enemyFailed',
    issueCommented: 'newItem',
    issueCreated: 'enemyFailed',
    issueDuplicated: 'enemyFailed',
    issueNotPlanned: 'enemyFailed',
    issueReopened: 'newItem',
    prCommented: 'newItem',
    prClosed: 'enemyFailed',
    prMade: 'newItem',
    prMerged: 'newItem',
    prReopened: 'newItem',
    repoCreated: 'newItem',
    repoDeleted: 'enemyFailed',
    repoStarred: 'newItem',
    repoUnstarred: 'enemyFailed',
    requestedChange: 'enemyFailed',
    emailSent: 'newItem',
    inboxCleared: 'newItem',
    taskDone: 'newItem'
} as const satisfies { [image in Actions]: keyof typeof sounds }

const animations = {
    duration: 1000,
    span: 3500,
    easings: {
        easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)'
    }
} as const

interface MessagePayload {
    action?: Actions
    delay?: number
    hostname?: string
    label?: string
    type?: string
}

// Initialize WebApp support for Gmail and other web apps
import { WebAppRegistry } from './webapps/registry'

const webAppRegistry = new WebAppRegistry()
webAppRegistry.initializeForHost(window.location.hostname)

// Listen for background messages
chrome.runtime.onMessage.addListener((message?: MessagePayload) => {
    if (!message?.action) return

    // Handle both git platform messages and webapp messages
    if (message.type === 'webapp_action' || message.action) {
        show(message.action, message.delay, message.label)
    }
})

function show(
    action: Actions,
    customDelay?: number,
    _label?: string
) {
    if (action in banners === false) return

    const delay = customDelay ?? 1000

    const banner = document.createElement('img')
    banner.src = chrome.runtime.getURL(banners[action])
    banner.style.position = 'fixed'
    banner.style.top = '0px'
    banner.style.right = '0px'
    banner.style.zIndex = '9999'
    banner.style.width = '100%'
    banner.style.height = '100vh'
    banner.style.objectFit = 'cover'
    banner.style.objectPosition = 'center'
    banner.style.opacity = '1'
    banner.style.pointerEvents = 'none'

    const audio = new Audio(chrome.runtime.getURL(sounds[bannerSounds[action]]))
    audio.volume = 0.25

    setTimeout(() => {
        requestIdleCallback(() => {
            document.body.appendChild(banner)

            banner.animate([{ opacity: 0 }, { opacity: 1 }], {
                duration: animations.duration,
                easing: animations.easings.easeOutQuart,
                fill: 'forwards'
            })

            audio.play().catch(() => {})
        })
    }, delay)

    setTimeout(() => {
        banner.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: animations.duration,
            easing: animations.easings.easeOutQuart,
            fill: 'forwards'
        })

        setTimeout(() => {
            banner.remove()
        }, animations.duration + delay)
    }, animations.span + delay)
}
