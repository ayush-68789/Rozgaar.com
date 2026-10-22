import React from 'react'
import { ArrowUpRight, BriefcaseBusiness, Check, MapPin, Sparkles } from 'lucide-react'

const AuthIllustration = ({ register = false }) => (
    <section className="auth-illustration-panel" aria-label="Rozgaar career illustration">
        <div className="auth-illustration-copy">
            <span className="auth-illustration-kicker"><Sparkles size={14} /> YOUR NEXT CHAPTER</span>
            <h2>{register ? <>A fresh start.<br /><span>A career that fits.</span></> : <>Big goals.<br /><span>Your next move.</span></>}</h2>
            <p>{register ? 'Create your profile and make it easier for the right opportunities to find you.' : 'Find roles that match your skills, experience, and ambitions.'}</p>
        </div>
        <div className="auth-illustration-scene" aria-hidden="true">
            <div className="auth-scene-sun" />
            <div className="auth-scene-orbit auth-scene-orbit-one" />
            <div className="auth-scene-orbit auth-scene-orbit-two" />
            <div className="auth-scene-plant"><i /><i /><i /><b /></div>
            <div className="auth-scene-person">
                <div className="auth-person-hair" />
                <div className="auth-person-head"><i /><i /><b /></div>
                <div className="auth-person-body"><span /></div>
                <div className="auth-person-arm" />
                <div className="auth-person-leg auth-person-leg-one" />
                <div className="auth-person-leg auth-person-leg-two" />
            </div>
            <div className="auth-scene-chair"><span /></div>
            <div className="auth-scene-desk"><div className="auth-scene-laptop"><span /></div><div className="auth-scene-mug" /></div>
            <div className="auth-scene-job-card"><span><BriefcaseBusiness size={15} /></span><div><strong>Product designer</strong><small><MapPin size={10} /> Remote · Full time</small></div><ArrowUpRight size={15} /></div>
            <div className="auth-scene-match"><Check size={13} /><span>Great match</span></div>
            <div className="auth-scene-floor" />
        </div>
        <div className="auth-illustration-foot"><span>Made for your next step</span><span className="auth-illustration-dots"><i /><i /><i /></span></div>
    </section>
)

export default AuthIllustration
