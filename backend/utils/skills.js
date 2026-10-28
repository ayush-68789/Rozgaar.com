// Skill normalisation + fit scoring shared by the job portal and the AI career coach.

const PHRASE_ALIASES = {
    'js': 'javascript', 'es6': 'javascript', 'ecmascript': 'javascript',
    'ts': 'typescript',
    'reactjs': 'react', 'react.js': 'react', 'react js': 'react',
    'nodejs': 'node', 'node.js': 'node', 'node js': 'node',
    'expressjs': 'express', 'express.js': 'express', 'express js': 'express',
    'vuejs': 'vue', 'vue.js': 'vue', 'nextjs': 'next', 'next.js': 'next',
    'mongo': 'mongodb', 'mongo db': 'mongodb',
    'postgres': 'postgresql', 'psql': 'postgresql',
    'mysql': 'sql', 'py': 'python',
    'c++': 'cpp', 'c plus plus': 'cpp',
    'dsa': 'data structures algorithms', 'data structures': 'data structures algorithms',
    'data structures and algorithms': 'data structures algorithms',
    'ml': 'machine learning', 'ai': 'artificial intelligence',
    'tailwindcss': 'tailwind', 'tailwind css': 'tailwind',
    'html5': 'html', 'css3': 'css',
    'rest': 'rest api', 'restful api': 'rest api', 'restful apis': 'rest api', 'rest apis': 'rest api',
    'git hub': 'github', 'k8s': 'kubernetes',
};

const STOP_WORDS = new Set(['and', 'or', 'the', 'a', 'an', 'of', 'in', 'with', 'for', 'to', 'years', 'year', 'yrs', 'yr', 'experience', 'knowledge', 'proficiency', 'good', 'strong', 'basic', 'working', 'understanding', 'skills', 'skill', 'plus', 'etc']);

// Dictionary used by the basic (no-AI) resume scanner and the goal fallback.
const KNOWN_SKILLS = [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'php', 'kotlin', 'swift',
    'react', 'next', 'vue', 'angular', 'redux', 'html', 'css', 'tailwind', 'bootstrap',
    'node', 'express', 'django', 'flask', 'spring', 'fastapi',
    'mongodb', 'sql', 'postgresql', 'redis', 'firebase',
    'rest api', 'graphql', 'jwt', 'docker', 'kubernetes', 'aws', 'azure', 'git', 'github', 'linux', 'ci cd',
    'data structures algorithms', 'oop', 'system design', 'operating systems', 'dbms', 'computer networks',
    'machine learning', 'deep learning', 'artificial intelligence', 'nlp', 'pandas', 'numpy', 'tensorflow', 'pytorch',
    'data analysis', 'power bi', 'tableau', 'excel', 'testing', 'jest', 'figma', 'ui ux',
];

const normalizeSkill = (value = '') => {
    const base = String(value).toLowerCase().trim().replace(/\s+/g, ' ');
    if (PHRASE_ALIASES[base]) return PHRASE_ALIASES[base];
    const cleaned = base.replace(/[^a-z0-9+#. ]/g, ' ').replace(/\s+/g, ' ').trim();
    return PHRASE_ALIASES[cleaned] || cleaned;
};

const tokensOf = (value) => {
    const normalized = normalizeSkill(value);
    return normalized.split(/[^a-z0-9+#]+/).filter(token => token && !STOP_WORDS.has(token))
        .map(token => PHRASE_ALIASES[token] || token)
        .flatMap(token => token.split(' '));
};

// A skill matches a requirement when every token of the shorter phrase appears in the longer one.
// Token based on purpose: "java" must NOT match "javascript".
const skillMatches = (a, b) => {
    const A = tokensOf(a);
    const B = tokensOf(b);
    if (!A.length || !B.length) return false;
    const [short, long] = A.length <= B.length ? [A, B] : [B, A];
    const longSet = new Set(long);
    return short.every(token => longSet.has(token));
};

const splitRequirements = (requirements) => {
    const list = Array.isArray(requirements) ? requirements : String(requirements || '').split(',');
    return [...new Set(list.flatMap(item => String(item).split(/[,•;|\n]/)).map(item => item.trim()).filter(Boolean))];
};

const computeFit = (requirements, userSkills = [], verifiedSkills = []) => {
    const reqs = splitRequirements(requirements);
    const skills = (userSkills || []).filter(Boolean);
    const verified = (verifiedSkills || []).map(item => (typeof item === 'string' ? item : item?.skill)).filter(Boolean);
    const matched = [];
    const missing = [];
    reqs.forEach(req => {
        (skills.some(skill => skillMatches(skill, req)) ? matched : missing).push(req);
    });
    const verifiedMatched = matched.filter(req => verified.some(skill => skillMatches(skill, req)));
    const score = reqs.length ? Math.round((matched.length / reqs.length) * 100) : 0;
    return { score, matched, missing, verifiedMatched, total: reqs.length };
};

const extractKnownSkills = (text = '') => {
    const lower = ` ${String(text).toLowerCase().replace(/\.(?=\s|$)/g, ' ').replace(/[^a-z0-9+#. ]/g, ' ')} `;
    return KNOWN_SKILLS.filter(skill => {
        if (skill === 'c') return /\sc\s/.test(lower) && /\bc programming|\bc language|\bc,\s|\bc\/c\+\+/i.test(text);
        const variants = [skill, ...Object.entries(PHRASE_ALIASES).filter(([, v]) => v === skill).map(([k]) => k)];
        return variants.some(variant => lower.includes(` ${variant.replace(/[^a-z0-9+#. ]/g, ' ')} `));
    });
};

module.exports = { normalizeSkill, skillMatches, splitRequirements, computeFit, extractKnownSkills, KNOWN_SKILLS };
