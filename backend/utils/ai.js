// Thin wrapper around Groq's OpenAI-compatible Chat Completions API. Returns null
// when no key is configured so each feature can use its built-in fallback.

const isAIEnabled = () => Boolean(process.env.GROQ_API_KEY?.trim());

const callAI = async ({ system, prompt, maxTokens = 2500, timeoutMs = 60000 }) => {
    if (!isAIEnabled()) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${process.env.GROQ_API_KEY.trim()}`
            },
            body: JSON.stringify({
                model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
                max_tokens: maxTokens,
                temperature: 0.2,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: prompt }
                ]
            })
        });
        if (!response.ok) {
            console.error('Groq API error:', response.status, (await response.text()).slice(0, 300));
            return null;
        }
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (error) {
        console.error('Groq request failed:', error.message);
        return null;
    } finally {
        clearTimeout(timer);
    }
};

const extractJSON = (text) => {
    if (!text) return null;
    const cleaned = text.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    try {
        return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
        return null;
    }
};

const callAIJSON = async (options) => extractJSON(await callAI(options));

module.exports = { isAIEnabled, callAI, callAIJSON, extractJSON };
