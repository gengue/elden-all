export interface StorageData {
    customGitLabDomains: string[]
}

const STORAGE_KEY = 'eldenGithubSettings'

export async function getCustomGitLabDomains(): Promise<string[]> {
    const result = await chrome.storage.sync.get(STORAGE_KEY)
    const data = result[STORAGE_KEY] as StorageData | undefined
    return data?.customGitLabDomains ?? []
}

export async function setCustomGitLabDomains(domains: string[]): Promise<void> {
    const data: StorageData = {
        customGitLabDomains: domains
    }
    await chrome.storage.sync.set({ [STORAGE_KEY]: data })
}

export async function addCustomGitLabDomain(domain: string): Promise<void> {
    const domains = await getCustomGitLabDomains()
    if (!domains.includes(domain)) {
        domains.push(domain)
        await setCustomGitLabDomains(domains)
    }
}

export async function removeCustomGitLabDomain(domain: string): Promise<void> {
    const domains = await getCustomGitLabDomains()
    const filtered = domains.filter((d) => d !== domain)
    await setCustomGitLabDomains(filtered)
}
