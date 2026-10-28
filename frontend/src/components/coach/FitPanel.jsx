import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { coachApi, errorMessage } from '@/utils/coachApi'
import '@/styles/coach.css'

// Shown on the job page for candidates: how ready are you for THIS job, and a one-click learning plan.
const FitPanel = ({ jobId }) => {
    const [data, setData] = useState(null)
    const [busy, setBusy] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        let cancelled = false
        coachApi.fit(jobId).then(res => { if (!cancelled) setData(res) }).catch(() => { if (!cancelled) setData(null) })
        return () => { cancelled = true }
    }, [jobId])

    if (!data?.fit) return null
    const { fit, planId } = data
    const ringColor = fit.score >= 70 ? '#16803c' : fit.score >= 40 ? '#b45309' : '#b42318'

    const buildPlan = async () => {
        if (planId) return navigate(`/coach/plan/${planId}`)
        setBusy(true)
        try {
            const res = await coachApi.planForJob(jobId)
            navigate(`/coach/plan/${res.plan._id}`)
        } catch (error) {
            toast.error(errorMessage(error, 'Could not build your plan.'))
        } finally {
            setBusy(false)
        }
    }

    return (
        <section className="job-description-section" aria-label="Your readiness for this job">
            <div className="coach-card">
                <div className="coach-fit">
                    <div className="coach-ring" style={{ '--p': fit.score, '--ring': ringColor }}><b>{fit.score}%</b></div>
                    <div>
                        <h2>How ready are you for this job?</h2>
                        <p className="coach-muted" style={{ margin: '4px 0 0' }}>
                            You match {fit.matched.length} of {fit.total} listed requirements
                            {fit.verifiedMatched.length > 0 && <> — {fit.verifiedMatched.length} proven by coach quizzes</>}.
                        </p>
                    </div>
                </div>
                {fit.matched.length > 0 && <div className="coach-chips" style={{ marginTop: 14 }}>{fit.matched.map(s => <span key={s} className="coach-chip ok">{s}</span>)}</div>}
                {fit.missing.length > 0 && <>
                    <p className="coach-muted" style={{ margin: '12px 0 6px' }}>Skills to build:</p>
                    <div className="coach-chips">{fit.missing.map(s => <span key={s} className="coach-chip miss">{s}</span>)}</div>
                    <div className="coach-row" style={{ marginTop: 16 }}>
                        <button type="button" className="coach-btn" onClick={buildPlan} disabled={busy}>
                            {busy ? 'Building your plan…' : planId ? 'Open my learning plan' : 'Build my learning plan'}
                        </button>
                        <Link to={`/resume-checker?jobId=${jobId}`} className="coach-btn ghost">Check my resume for this job</Link>
                    </div>
                </>}
                {fit.missing.length === 0 && fit.total > 0 && <p className="coach-notice">You cover every listed requirement. Polish your resume and apply.</p>}
            </div>
        </section>
    )
}

export default FitPanel
