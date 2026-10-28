import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ExternalLink, Trash2 } from 'lucide-react'
import CoachShell from '@/components/coach/CoachShell'
import StudentRoute from '@/components/coach/StudentRoute'
import ReadinessBadge from '@/components/coach/ReadinessBadge'
import { coachApi, errorMessage } from '@/utils/coachApi'

const GoalBox = ({ onDone }) => {
    const [goal, setGoal] = useState('')
    const [busy, setBusy] = useState(false)
    const navigate = useNavigate()

    const submit = async event => {
        event.preventDefault()
        setBusy(true)
        try {
            const res = await coachApi.goal(goal)
            if (res.plan) { toast.success('Your learning plan is ready.'); navigate(`/coach/plan/${res.plan._id}`) }
            else { toast.info(res.message || 'You already cover this goal.'); onDone?.() }
        } catch (error) {
            toast.error(errorMessage(error, 'Could not analyze your goal.'))
        } finally {
            setBusy(false)
        }
    }

    return (
        <form className="coach-card" onSubmit={submit}>
            <h2>What’s your career goal?</h2>
            <p className="coach-muted" style={{ margin: '4px 0 12px' }}>Describe the role you want. We compare it with your profile skills and build a week-by-week plan for the gaps.</p>
            <label htmlFor="goal" className="coach-muted">Goal</label>
            <textarea id="goal" className="coach-textarea" value={goal} onChange={e => setGoal(e.target.value)} maxLength={400}
                placeholder="e.g. Full-stack developer at a product company, ready for placements in 6 months" required />
            <div style={{ marginTop: 12 }}>
                <button type="submit" className="coach-btn" disabled={busy || goal.trim().length < 5}>{busy ? 'Analyzing your goal…' : 'Analyze goal & build plan'}</button>
            </div>
        </form>
    )
}

const ProjectsCard = ({ projects, onChange }) => {
    const [form, setForm] = useState({ title: '', link: '', skills: '' })
    const [busy, setBusy] = useState(false)

    const add = async event => {
        event.preventDefault()
        setBusy(true)
        try {
            const res = await coachApi.addProject(form)
            onChange(res.projects)
            setForm({ title: '', link: '', skills: '' })
            toast.success(res.message)
        } catch (error) {
            toast.error(errorMessage(error, 'Could not add the project.'))
        } finally {
            setBusy(false)
        }
    }
    const remove = async id => {
        try { onChange((await coachApi.deleteProject(id)).projects) } catch (error) { toast.error(errorMessage(error)) }
    }

    return (
        <section className="coach-card" aria-labelledby="projects-h">
            <header><h2 id="projects-h">My projects</h2><span className="coach-muted">Recruiters see these on your application</span></header>
            {projects.length === 0 && <p className="coach-empty">Add your best projects. Plans also suggest portfolio ideas.</p>}
            <ul className="coach-list">
                {projects.map(project => (
                    <li key={project._id}>
                        <div className="coach-row" style={{ justifyContent: 'space-between' }}>
                            <strong>{project.title}</strong>
                            <span className="coach-row">
                                {project.link && <a href={project.link} target="_blank" rel="noreferrer" aria-label={`Open ${project.title}`}><ExternalLink size={16} /></a>}
                                <button type="button" onClick={() => remove(project._id)} aria-label={`Remove ${project.title}`} style={{ background: 'none', border: 0, cursor: 'pointer', color: '#b42318' }}><Trash2 size={16} /></button>
                            </span>
                        </div>
                        {project.skills?.length > 0 && <div className="coach-chips" style={{ marginTop: 6 }}>{project.skills.map(skill => <span className="coach-chip" key={skill}>{skill}</span>)}</div>}
                    </li>
                ))}
            </ul>
            <form onSubmit={add} style={{ display: 'grid', gap: 8, marginTop: 14 }}>
                <input className="coach-input" placeholder="Project title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required maxLength={120} aria-label="Project title" />
                <input className="coach-input" placeholder="Link (GitHub or live demo, optional)" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} aria-label="Project link" />
                <input className="coach-input" placeholder="Skills used, comma separated" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} aria-label="Skills used" />
                <div><button type="submit" className="coach-btn small" disabled={busy || !form.title.trim()}>Add project</button></div>
            </form>
        </section>
    )
}

const Dashboard = () => {
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const [projects, setProjects] = useState([])

    const load = useCallback(async () => {
        try {
            const res = await coachApi.overview()
            setData(res.overview)
            setProjects(res.overview.projects || [])
        } catch (err) {
            setError(errorMessage(err, 'Could not load your dashboard.'))
        }
    }, [])
    useEffect(() => { load() }, [load])

    const removePlan = async id => {
        if (!confirm('Delete this learning plan? Skills you already verified stay on your profile.')) return
        try { await coachApi.deletePlan(id); toast.success('Plan deleted.'); load() } catch (err) { toast.error(errorMessage(err)) }
    }

    if (error) return <CoachShell title="Career coach"><p className="coach-note">{error}</p></CoachShell>
    if (!data) return <CoachShell title="Career coach"><p className="coach-empty">Loading your dashboard…</p></CoachShell>

    const quizVerified = data.verifiedSkills.filter(item => item.source === 'quiz')

    return (
        <CoachShell title={`Hi ${data.name?.split(' ')[0] || 'there'}, let’s get you job-ready`}
            subtitle={data.targetRole ? `Current goal: ${data.targetRole}` : 'Set a goal, close your skill gaps, then apply with proof.'}>
            {!data.aiEnabled && <p className="coach-note">AI is off on this server, so plans use built-in templates and quizzes are self-assessments. Set <code>ANTHROPIC_API_KEY</code> in the backend <code>.env</code> to get personalised plans, real quizzes and deeper resume feedback.</p>}
            <div className="coach-stats">
                <div className="coach-stat"><strong>{data.learningProgress}%</strong><span>learning progress</span></div>
                <div className="coach-stat"><strong>{quizVerified.length}</strong><span>quiz-verified skills</span></div>
                <div className="coach-stat"><strong>{data.plans.length}</strong><span>learning plans</span></div>
                <div className="coach-stat"><strong>{data.applications}</strong><span>applications sent</span></div>
            </div>
            <div className="coach-grid">
                <div className="coach-col-8" style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
                    <GoalBox onDone={load} />
                    <section className="coach-card" aria-labelledby="plans-h">
                        <header><h2 id="plans-h">My learning plans</h2></header>
                        {data.plans.length === 0 && <p className="coach-empty">No plans yet. Describe a goal above, or open a job and choose “Build my learning plan”.</p>}
                        <ul className="coach-list">
                            {data.plans.map(plan => (
                                <li key={plan._id}>
                                    <div className="coach-row" style={{ justifyContent: 'space-between' }}>
                                        <Link to={`/coach/plan/${plan._id}`}><strong>{plan.title}</strong></Link>
                                        <button type="button" className="coach-btn danger small" onClick={() => removePlan(plan._id)} aria-label={`Delete ${plan.title}`}>Delete</button>
                                    </div>
                                    <p className="coach-muted" style={{ margin: '4px 0 8px' }}>{plan.progress.passed} of {plan.progress.total} weeks complete</p>
                                    <div className="coach-bar" role="progressbar" aria-valuenow={plan.progress.percent} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${plan.progress.percent}%` }} /></div>
                                </li>
                            ))}
                        </ul>
                    </section>
                    <ProjectsCard projects={projects} onChange={setProjects} />
                </div>
                <div className="coach-col-4" style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
                    <section className="coach-card" aria-labelledby="skills-h">
                        <header><h2 id="skills-h">My skills</h2></header>
                        {data.skills.length === 0 && data.verifiedSkills.length === 0 && <p className="coach-empty">Add skills on your <Link to="/profile">profile</Link> or run the <Link to="/coach/resume">resume analyzer</Link>.</p>}
                        <div className="coach-chips">
                            {data.verifiedSkills.map(item => <span key={item.skill} className={`coach-chip ${item.source === 'quiz' ? 'ok' : 'self'}`} title={item.source === 'quiz' ? `Passed quiz (${item.score}%)` : 'Self-assessed'}>{item.source === 'quiz' ? '✓ ' : ''}{item.skill}</span>)}
                            {data.skills.filter(skill => !data.verifiedSkills.some(item => item.skill.toLowerCase() === skill.toLowerCase())).map(skill => <span key={skill} className="coach-chip">{skill}</span>)}
                        </div>
                    </section>
                    <section className="coach-card" aria-labelledby="rec-h">
                        <header><h2 id="rec-h">Jobs that fit you</h2></header>
                        {data.recommended.length === 0 && <p className="coach-empty">No open jobs to compare yet. Check back soon.</p>}
                        <ul className="coach-list">
                            {data.recommended.map(job => (
                                <li key={job._id}>
                                    <Link to={`/description/${job._id}`} className="coach-job">
                                        <span><strong>{job.title}</strong><span className="coach-muted">{job.company?.name || 'Company'}{job.location ? ` · ${job.location}` : ''}</span></span>
                                        <ReadinessBadge score={job.fit.score} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </div>
        </CoachShell>
    )
}

const CoachDashboard = () => <StudentRoute><Dashboard /></StudentRoute>

export default CoachDashboard
