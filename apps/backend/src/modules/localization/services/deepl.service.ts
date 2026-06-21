import { env } from '../../../config/env';

export class DeeplService {
    private apiKey: string | undefined;
    private apiUrl: string;

    constructor() {
        this.apiKey = env.DEEPL_API_KEY;
        this.apiUrl = env.DEEPL_API_URL;
    }

    async translate(text: string[], targetLang: string, sourceLang?: string): Promise<string[]> {
        if (!this.apiKey) {
            throw new Error('DeepL API Key is not configured');
        }

        const body = {
            text,
            target_lang: targetLang.toUpperCase(),
            source_lang: sourceLang?.toUpperCase(),
        };

        const response = await fetch(`${this.apiUrl}/translate`, {
            method: 'POST',
            headers: {
                'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('DeepL API Key is invalid or unauthorized.');
            }
            if (response.status === 456) {
                throw new Error('DeepL API Quota exceeded.');
            }
            const error = await response.text();
            throw new Error(`DeepL translation failed: ${error}`);
        }

        const data = await response.json() as { translations: { text: string }[] };
        return data.translations.map(t => t.text);
    }
}

