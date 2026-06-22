export interface Project {
    id: string
    name: string
    reviewEnabled?: boolean
    requireTemplate?: boolean
    inContextUrl?: string | null
}