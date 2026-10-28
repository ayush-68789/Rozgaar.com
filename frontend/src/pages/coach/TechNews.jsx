import { useCallback, useEffect, useState } from 'react'
import CoachShell from '@/components/coach/CoachShell'
import StudentRoute from '@/components/coach/StudentRoute'
import { coachApi, errorMessage } from '@/utils/coachApi'

const SUGGESTED = ['javascript', 'react', 'node', 'python', 'ai', 'cloud', 'cybersecurity', 'system design']

const News = () => {
    const [topics, setTopics] = useState([])
    const [custom, setCustom] = useState('')
    const [state, setState] = useState({ loading: true, news: [], used: [], error: '', message: '' })

    const load = useCallback(async (selected) => {
        setState(prev => ({ ...prev, loading: true, error: '' }))
        try {
            const res = await coachApi.news(selected)
            setState({ loading: false, news: res.news, used: res.topics, error: '', message: res.message || '' })
        } catch (error) {
            setState(prev => ({ ...prev, loading: false, error: errorMessage(error, 'Could not load news.') }))
        }
    }, [])

    useEffect(() => { load([]) }, [load])

    const toggle = topic => {
        const next = topics.includes(topic) ? topics.filter(item => item !== topic) : [...topics, topic].slice(-4)
        setTopics(next)
        load(next)
    }
    const addCustom = event => {
        event.preventDefault()
        const value = custom.trim().toLowerCase()
        if (!value) return
        const next = [...new Set([...topics, value])].slice(-4)
        setTopics(next); setCustom(''); load(next)
    }

    return (
        <CoachShell title="Tech news" subtitle="Stories from the developer community, matched to your skills. Pick up to four topics to change the feed.">
            <div className="coach-card" style={{ margin: '20px 0' }}>
                <div className="coach-chips" role="group" aria-label="Topics">
                    {[...new Set([...SUGGESTED, ...topics])].map(topic => (
                        <button key={topic} type="button" onClick={() => toggle(topic)} aria-pressed={topics.includes(topic)}
                            className={`coach-chip ${topics.includes(topic) ? 'ok' : ''}`} style={{ border: 0, cursor: 'pointer' }}>{topic}</button>
                    ))}
                </div>
                <form onSubmit={addCustom} className="coach-row" style={{ marginTop: 12 }}>
                    <input className="coach-input" style={{ maxWidth: 280 }} value={custom} onChange={e => setCustom(e.target.value)} placeholder="Add your own topic" aria-label="Add a topic" />
                    <button type="submit" className="coach-btn small ghost">Add</button>
                </form>
                {topics.length === 0 && state.used.length > 0 && <p className="coach-muted" style={{ marginBottom: 0 }}>Showing your skills: {state.used.join(', ')}</p>}
            </div>
            {state.error && <p className="coach-note" role="alert">{state.error}</p>}
            {state.loading && <p className="coach-empty">Loading stories…</p>}
            {!state.loading && state.message && <p className="coach-empty">{state.message}</p>}
            <ul className="coach-list coach-news">
                {state.news.map(item => (
                    <li key={item.id}>
                        <a href={item.url} target="_blank" rel="noreferrer">
                            <strong>{item.title}</strong>
                            <span className="coach-muted">{item.source} · {item.points} points · {item.comments} comments · {new Date(item.publishedAt).toLocaleDateString()}</span>
                            <div style={{ marginTop: 6 }}><span className="coach-chip">{item.topic}</span></div>
                        </a>
                    </li>
                ))}
            </ul>
        </CoachShell>
    )
}

const TechNews = () => <StudentRoute><News /></StudentRoute>

export default TechNews
