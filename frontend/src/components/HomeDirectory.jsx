import React, { useMemo } from 'react'
import { ArrowRight, Building2, BriefcaseBusiness, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'

const roleSearches = [
    ['Full Stack Developer', 'Full Stack'],
    ['Frontend Developer', 'Frontend'],
    ['Backend Developer', 'Backend'],
    ['Data Analyst', 'Data Analyst'],
    ['Business Analyst', 'Business Analyst'],
    ['DevOps Engineer', 'DevOps'],
    ['Product Manager', 'Product Manager'],
    ['UI / UX Designer', 'Designer']
]

const HomeDirectory = () => {
    const { allJobs, setSearchedQuery, setJobFilters } = useApp()
    const navigate = useNavigate()
    const companies = useMemo(() => {
        const companyJobs = new Map()
        allJobs.filter(job => job.isOpen !== false && job.company?.name).forEach(job => {
            const company = job.company
            const entry = companyJobs.get(company._id) || { ...company, openings: 0 }
            entry.openings += 1
            companyJobs.set(company._id, entry)
        })
        return [...companyJobs.values()].sort((a, b) => b.openings - a.openings).slice(0, 5)
    }, [allJobs])

    const searchJobs = query => {
        setSearchedQuery(query)
        setJobFilters({ location: '', industry: '', salary: '', experience: '' })
        navigate('/jobs')
    }

    return (
        <>
            <section className="home-directory-section home-company-section" id="companies">
                <div className="home-section-heading">
                    <div><h2>Top companies hiring now</h2><p>Explore employers with open roles on Rozgaar.com.</p></div>
                    <button type="button" className="home-view-all" onClick={() => searchJobs('')}>View all jobs <ArrowRight size={15} /></button>
                </div>
                {companies.length ? <div className="home-company-grid">{companies.map(company => <button className="home-company-card" type="button" key={company._id} onClick={() => searchJobs(company.name)}>
                    <span className="home-company-card-top">{company.logo ? <img src={company.logo} alt="" /> : <span className="home-company-initial">{company.name.charAt(0).toUpperCase()}</span>}<ChevronRight size={15} /></span>
                    <strong>{company.name}</strong><small>{company.openings} open {company.openings === 1 ? 'role' : 'roles'}</small>
                </button>)}</div> : <div className="home-company-empty"><Building2 size={20} />Company cards will appear as employers post jobs.</div>}
            </section>

            <section className="home-directory-section home-roles-section">
                <div className="home-section-heading"><div><h2>Discover jobs by popular roles</h2><p>Pick a role to see matching openings.</p></div></div>
                <div className="home-role-grid">{roleSearches.map(([label, query]) => {
                    const count = allJobs.filter(job => `${job.title} ${job.description || ''}`.toLowerCase().includes(query.toLowerCase())).length
                    return <button type="button" key={label} className="home-role-card" onClick={() => searchJobs(query)}><span><BriefcaseBusiness size={17} /></span><strong>{label}</strong><small>{count} {count === 1 ? 'job' : 'jobs'} <ArrowRight size={13} /></small></button>
                })}</div>
            </section>
        </>
    )
}

export default HomeDirectory
