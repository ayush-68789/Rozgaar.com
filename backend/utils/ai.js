// Thin wrapper around the Anthropic Messages API. Returns null when no key is configured
// so every feature can fall back to a rule-based version instead of failing.

const isAIEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

const callClaude = async ({ system, prompt, maxTokens = 2500, timeoutMs = 60000 }) => {
    if (!isAIEnabled()) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'content-type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
                max_tokens: maxTokens,
                system,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        if (!response.ok) {
            console.error('Anthropic API error:', response.status, (await response.text()).slice(0, 300));
            return null;
        }
        const data = await response.json();
        return (data.content || []).filter(block => block.type === 'text').map(block => block.text).join('\n');
    } catch (error) {
        console.error('Anthropic request failed:', error.message);
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

const callClaudeJSON = async (options) => extractJSON(await callClaude(options));

module.exports = { isAIEnabled, callClaude, callClaudeJSON, extractJSON };
