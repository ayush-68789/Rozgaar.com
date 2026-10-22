import React, { useState } from 'react'
import { ArrowRight, BriefcaseBusiness, MapPin, Search } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Link, useNavigate } from 'react-router-dom'

const HeroSection = () => {
    const [keyword, setKeyword] = useState('')
    const [experience, setExperience] = useState('')
    const [location, setLocation] = useState('')
    const { allJobs, user, setSearchedQuery, setJobFilters } = useApp()
    const navigate = useNavigate()

    const searchJobs = (event) => {
        event.preventDefault()
        setSearchedQuery(keyword.trim())
        setJobFilters(current => ({ ...current, location: location.trim(), experience }))
        navigate('/jobs')
    }

    return (
        <section className="home-hero">
            <div className="home-hero-inner">
                <div className="hero-copy">
                    <span className="eyebrow">YOUR NEXT OPPORTUNITY STARTS HERE</span>
                    <h1>Find your dream job <span>today</span></h1>
                    <p className="hero-subtitle">{allJobs?.length || 0} opportunities to explore on Rozgaar.com</p>
                    {user?.role !== 'student' && <Link className="hero-employer-link" to="/employer/login"><BriefcaseBusiness size={15} /> Hiring talent? <strong>For employers</strong> <ArrowRight size={14} /></Link>}
                </div>
            </div>
            <form className="search-panel" onSubmit={searchJobs}>
                <label className="search-input-wrap"><Search size={19} /><input aria-label="Skills, job title or company" type="search" placeholder="Enter skills / designations / companies" value={keyword} onChange={event => setKeyword(event.target.value)} /></label>
                <label className="hero-select-wrap"><select aria-label="Select experience" value={experience} onChange={event => setExperience(event.target.value)}><option value="">Select experience</option><option value="fresher">Fresher</option><option value="0-1">0–1 years</option><option value="1-3">1–3 years</option><option value="3-5">3–5 years</option><option value="5+">5+ years</option></select></label>
                <label className="hero-location-wrap"><MapPin size={17} /><input aria-label="Enter location" placeholder="Enter location" value={location} onChange={event => setLocation(event.target.value)} /></label>
                <button className="search-submit" type="submit">Search <ArrowRight size={15} /></button>
            </form>
            <div className="hero-trending" aria-label="Trending searches">
                <span>Trending:</span>
                {['html and css', 'front end developer', 'data analyst'].map(term => <button key={term} type="button" onClick={() => { setKeyword(term); setSearchedQuery(term); setJobFilters({ location: '', industry: '', salary: '', experience: '' }); navigate('/jobs') }}>{term} <span>↗</span></button>)}
            </div>
        </section>
    )
}

export default HeroSection
