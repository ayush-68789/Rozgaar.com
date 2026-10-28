import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { BriefcaseBusiness, FileText, LoaderCircle, Sparkles } from 'lucide-react'
import OpportunityLayout from '@/components/shared/OpportunityLayout'
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
        <OpportunityLayout activePage="Resume ATS Checker" breadcrumb="Resume ATS Checker">
        <div className="coach-page resume-checker-page">
            <main className="coach-main">
                <div className="coach-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>Resume ATS Checker</h1>
                        <p className="coach-sub">Check your resume for ATS basics, get focused fixes, or compare it against a specific job.</p>
                    </div>
                    <Link to="/profile" className="coach-btn ghost">My profile</Link>
                </div>
            <section className="coach-card resume-checker-form-card" aria-labelledby="resume-checker-form-title">
                <div className="resume-checker-form-heading">
                    <span><BriefcaseBusiness size={19} /></span>
                    <div><h2 id="resume-checker-form-title">Tailor your resume for a role</h2><p>Choose a job for a targeted review, or run a general ATS check.</p></div>
                </div>
                {!hasResume && <p className="coach-note resume-checker-missing">You haven’t uploaded a resume yet. Add one on your <Link to="/profile">profile</Link> (PDF or DOCX) to get started.</p>}
                <div className="resume-checker-field">
                    <label htmlFor="job">Compare with a job <span>Optional</span></label>
                    <select id="job" className="coach-select" value={jobId} onChange={e => setJobId(e.target.value)}>
                        <option value="">General review — no specific job</option>
                        {jobs.map(job => <option key={job._id} value={job._id}>{job.title} — {job.company?.name || 'Company'}</option>)}
                    </select>
                    <small>Your resume will be checked against the role requirements and keywords.</small>
                </div>
                <div className="resume-checker-form-footer">
                    <button type="button" className="coach-btn resume-checker-submit" onClick={analyze} disabled={busy || !hasResume}>
                        {busy ? <><LoaderCircle size={16} className="resume-checker-spinner" /> Analyzing resume…</> : <><Sparkles size={16} /> Analyze my resume</>}
                    </button>
                    {user?.profile?.resumeName && <span className="resume-checker-file"><FileText size={15} /><span>{user.profile.resumeName}</span></span>}
                </div>
                {error && <p className="coach-note" role="alert">{error}</p>}
            </section>

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
            </main>
        </div>
        </OpportunityLayout>
    )
}

const ResumeChecker = () => <StudentRoute><Analyzer /></StudentRoute>

export default ResumeChecker
