export class GoogleService {
    async translate(text: string[], targetLang: string, sourceLang?: string): Promise<string[]> {
        const results: string[] = [];

        for (const segment of text) {
            const sl = sourceLang || 'auto';
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${targetLang}&dt=t&q=${encodeURIComponent(segment)}`;

            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Google translation failed: ${error}`);
            }

            const data = await response.json() as any;
            const translatedText = data[0].map((item: any) => item[0]).join('');
            results.push(translatedText);
        }

        return results;
    }
}

