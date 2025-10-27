import type { ActionType } from '../base'

export const GITLAB_HOSTNAME = 'gitlab.com'

export const GRAPHQL_ENDPOINT_PATH = '/api/graphql'

export const ACTION_LABELS: Record<ActionType, string> = {
    assignmentUpdated: 'Assignment updated',
    codeReviewed: 'Code reviewed',
    commentEdited: 'Comment edited',
    issueClosed: 'Issue closed',
    issueCommented: 'Issue commented',
    issueCreated: 'Issue created',
    issueDuplicated: 'Issue duplicated',
    issueNotPlanned: 'Issue not planned',
    issueReopened: 'Issue reopened',
    prCommented: 'Merge request commented',
    prClosed: 'Merge request closed',
    prMade: 'Merge request made',
    prMerged: 'Merge request merged',
    prReopened: 'Merge request reopened',
    repoCreated: 'Project created',
    repoDeleted: 'Project deleted',
    repoStarred: 'Project starred',
    repoUnstarred: 'Project unstarred',
    requestedChange: 'Changes requested'
}

export const DELAYS: Partial<Record<ActionType, number>> = {
    prMerged: 3000,
    repoCreated: 3000,
    prMade: 0,
    repoDeleted: 0
}
