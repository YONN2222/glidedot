export interface TranslationKey {
    id: number
    key: string
    labels?: TranslationLabel[]
}

export interface TranslationKeyScopeNode {
    id: string
    name: string
    level: number
    hasChildren: boolean
    isExpanded: boolean
    keyCount: number
}

export interface Language {
    id: number
    code: string
    name: string
    flag: string
    isRef?: boolean
}

export interface TranslationLabel {
    id: number
    name: string
    color?: string
}

export interface TranslationText {
    id: number
    key: TranslationKey
    text: string
    isGenerated?: boolean
}