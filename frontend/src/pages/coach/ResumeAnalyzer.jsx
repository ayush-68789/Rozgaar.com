import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import CoachShell from '@/components/coach/CoachShell'
import StudentRoute from '@/components/coach/StudentRoute'
import { useApp } from '@/context/AppContext'
import { JOB_API_END_POINT } from '@/utils/constant'
import { coachApi, errorMessage } from '@/utils/coachApi'

const Section = ({ title, items, tone }) => items?.length > 0 && (
    <section className="coach-card">
        <header><h2>{title}</h2></header>
        {tone ? <div className="coach-chips">{items.map(item => <span key={item} className={`coach-chip ${tone}`}>{item}</span>)}</div>
            : <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.65 }}>{items.map(item => <li key={item}>{item}</li>)}</ul>}
    </section>
)

const Analyzer = () => {
    const { user, setUser } = useApp()
    const [params] = useSearchParams()
    const [jobs, setJobs] = useState([])
    const [jobId, setJobId] = useState(params.get('jobId') || '')
    const [busy, setBusy] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        axios.get(`${JOB_API_END_POINT}/get`, { params: { limit: 100 }, withCredentials: true })
            .then(res => setJobs(res.data.jobs || [])).catch(() => {})
    }, [])

    const analyze = async () => {
        setBusy(true); setError(''); setResult(null)
        try {
            const res = await coachApi.analyzeResume(jobId)
            setResult(res)
        } catch (err) {
            setError(errorMessage(err, 'Could not analyze your resume.'))
        } finally {
            setBusy(false)
        }
    }

    const addDetected = async () => {
        try {
            const res = await coachApi.addSkills(result.analysis.detectedSkills)
            setUser({ ...user, profile: { ...user.profile, skills: res.skills } })
            toast.success(res.message)
        } catch (err) {
            toast.error(errorMessage(err))
        }
    }

    const hasResume = Boolean(user?.profile?.resumeUrl)
    const analysis = result?.analysis
    const scoreColor = analysis ? (analysis.score >= 70 ? '#16803c' : analysis.score >= 45 ? '#b45309' : '#b42318') : '#1769d2'

    return (
        <CoachShell title="Resume analyzer" subtitle="We read the resume stored on your profile, score it, and tell you exactly what to fix. Optionally compare it against a specific job.">
            <div className="coach-card" style={{ marginTop: 20 }}>
                {!hasResume && <p className="coach-note" style={{ marginTop: 0 }}>You haven’t uploaded a resume yet. Add one on your <Link to="/profile">profile</Link> (PDF or DOCX), then come back.</p>}
                <label htmlFor="job" className="coach-muted">Compare with a job (optional)</label>
                <select id="job" className="coach-select" value={jobId} onChange={e => setJobId(e.target.value)}>
                    <option value="">General review — no specific job</option>
                    {jobs.map(job => <option key={job._id} value={job._id}>{job.title} — {job.company?.name || 'Company'}</option>)}
                </select>
                <div className="coach-row" style={{ marginTop: 14 }}>
                    <button type="button" className="coach-btn" onClick={analyze} disabled={busy || !hasResume}>{busy ? 'Analyzing…' : 'Analyze my resume'}</button>
                    {user?.profile?.resumeName && <span className="coach-muted">{user.profile.resumeName}</span>}
                </div>
                {error && <p className="coach-note" role="alert">{error}</p>}
            </div>

            {analysis && <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
                <section className="coach-card">
                    <div className="coach-fit">
                        <div className="coach-ring" style={{ '--p': analysis.score, '--ring': scoreColor }}><b>{analysis.score}</b></div>
                        <div>
                            <h2>Resume score{result.job ? ` for ${result.job.title}` : ''}</h2>
                            <p className="coach-muted" style={{ margin: '4px 0 0', maxWidth: '60ch' }}>{analysis.summary}</p>
                            <span className="coach-chip" style={{ marginTop: 8, display: 'inline-block' }}>{analysis.mode === 'ai' ? 'AI review' : 'Basic scan'}</span>
                        </div>
                    </div>
                </section>
                <div className="coach-grid">
                    <div className="coach-col-6"><Section title="Strengths" items={analysis.strengths} /></div>
                    <div className="coach-col-6"><Section title="Needs work" items={analysis.weaknesses} /></div>
                </div>
                <Section title="Suggested improvements" items={analysis.suggestions} />
                <Section title={result.job ? 'Missing for this job' : 'Missing keywords'} items={analysis.missingKeywords} tone="miss" />
                {analysis.detectedSkills?.length > 0 && <section className="coach-card">
                    <header><h2>Skills found in your resume</h2><button type="button" className="coach-btn small ghost" onClick={addDetected}>Add to my profile</button></header>
                    <div className="coach-chips">{analysis.detectedSkills.map(skill => <span key={skill} className="coach-chip ok">{skill}</span>)}</div>
                </section>}
                {result.job && <div><Link to={`/description/${result.job._id}`} className="coach-btn ghost">Back to the job</Link></div>}
            </div>}
        </CoachShell>
    )
}

const ResumeAnalyzer = () => <StudentRoute><Analyzer /></StudentRoute>

export default ResumeAnalyzer
