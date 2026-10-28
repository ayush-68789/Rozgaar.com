import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BriefcaseBusiness, Building2, ChevronDown, FileUp, Filter, MapPin, Search, Sparkles } from 'lucide-react'
import OpportunityLayout from '@/components/shared/OpportunityLayout'
import FilterCard from '@/components/FilterCard'
import JobCard from '@/components/JobCard'
import { useApp } from '@/context/AppContext'
import useGetAllJobs from '@/hooks/useGetAllJobs'
import useGetAppliedJobs from '@/hooks/useGetAppliedJobs'
import { getMonthlySalaryInRupees } from '@/utils/salary'
import { coachApi, errorMessage } from '@/utils/coachApi'

const Jobs = () => {
    useGetAllJobs()
    const { allJobs, searchedQuery, jobFilters, setJobFilters, user } = useApp()
    useGetAppliedJobs({ enabled: user?.role === 'student' })
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [recommendationState, setRecommendationState] = useState({ loading: false, recommendations: [], error: '', mode: '', hasRecommendations: false, hasResume: false })

    useEffect(() => {
        if (user?.role !== 'student') {
            setRecommendationState({ loading: false, recommendations: [], error: '', mode: '', hasRecommendations: false, hasResume: false })
            return
        }
        let active = true
        setRecommendationState({ loading: true, recommendations: [], error: '', mode: '', hasRecommendations: false, hasResume: false })
        coachApi.recommendations().then(result => {
            if (active) setRecommendationState({ loading: false, recommendations: result.recommendations || [], error: '', mode: result.mode || 'skills', hasRecommendations: result.hasRecommendations, hasResume: result.hasResume })
        }).catch(error => {
            if (active) setRecommendationState({ loading: false, recommendations: [], error: errorMessage(error, 'Could not load job suggestions.'), mode: '' })
        })
        return () => { active = false }
    }, [user?._id, user?.role])

    const filteredJobs = useMemo(() => {
        const query = searchedQuery.trim().toLowerCase()
        const salaryRanges = {
            '₹0–40,000 / month': [0, 40000],
            '₹40,000–1,00,000 / month': [40000, 100000],
            '₹1,00,000–5,00,000 / month': [100000, 500000],
            '₹5,00,000+ / month': [500000, Infinity],
        }
        const compact = value => (value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        const selectedValues = value => Array.isArray(value) ? value : value ? [value] : []
        const locationAliases = { delhincr: ['delhi', 'ncr', 'noida', 'gurgaon', 'gurugram'], bangalore: ['bangalore', 'bengaluru'] }
        const industryAliases = { fullstackdeveloper: ['fullstackdeveloper', 'fullstack', 'fullstackdevelopment'] }

        return allJobs.filter(job => {
            const searchableText = [job.title, job.description, job.location, job.jobType, job.company?.name, ...(job.requirements || [])].filter(Boolean).join(' ').toLowerCase()
            if (query && !searchableText.includes(query)) return false

            const selectedTypes = selectedValues(jobFilters.type)
            if (selectedTypes.length && !selectedTypes.some(type => String(job.jobType || '').toLowerCase() === type.toLowerCase())) return false

            const selectedLocations = selectedValues(jobFilters.location)
            if (selectedLocations.length) {
                const locationText = `${job.location || ''} ${job.jobType || ''}`.toLowerCase()
                if (!selectedLocations.some(location => {
                    const value = location.toLowerCase()
                    const aliases = locationAliases[compact(value)] || [value]
                    return aliases.some(alias => locationText.includes(alias)) || (value === 'remote' && /remote|work from home|wfh/i.test(locationText))
                })) return false
            }

            const selectedRoles = selectedValues(jobFilters.industry)
            if (selectedRoles.length) {
                const compactText = compact(searchableText)
                if (!selectedRoles.some(role => (industryAliases[compact(role)] || [compact(role)]).some(value => compactText.includes(value)))) return false
            }

            const selectedSalaries = selectedValues(jobFilters.salary)
            if (selectedSalaries.length) {
                const salary = getMonthlySalaryInRupees(job)
                if (!selectedSalaries.some(range => {
                    const [min, max] = salaryRanges[range] || []
                    return Number.isFinite(salary) && min !== undefined && salary >= min && salary <= max
                })) return false
            }
            if (jobFilters.experience) {
                const years = Number(job.experienceLevel || 0)
                const experienceMatches = { fresher: years === 0, '0-1': years <= 1, '1-3': years > 1 && years <= 3, '3-5': years > 3 && years <= 5, '5+': years >= 5 }
                if (!experienceMatches[jobFilters.experience]) return false
            }
            return true
        })
    }, [allJobs, searchedQuery, jobFilters])

    const jobTypes = [...new Set(allJobs.map(job => job.jobType).filter(Boolean))]
    const locations = [...new Set(allJobs.map(job => job.location).filter(Boolean))]
    const roles = [...new Set(allJobs.map(job => job.title).filter(Boolean))].slice(0, 12)
    const activeFilters = ['type', 'location', 'industry', 'salary', 'experience'].reduce((total, key) => total + (Array.isArray(jobFilters[key]) ? jobFilters[key].length : jobFilters[key] ? 1 : 0), 0)
    const setSingleFilter = (key, value) => setJobFilters(current => ({ ...current, [key]: value }))
    const categoryChips = jobTypes.slice(0, 6)

    return (
        <OpportunityLayout activePage="Jobs" breadcrumb="Jobs" searchPlaceholder="Search Jobs" showFooter>
            <main className="jobs-reference-content">
                <div className="jobs-reference-main-column">
                    <header className="jobs-reference-heading">
                        <h1>{filteredJobs.length} Jobs for Students</h1>
                        <p>Find the latest job openings for students.</p>
                    </header>

                    {categoryChips.length > 0 && <nav className="jobs-category-chips" aria-label="Job types">
                        {categoryChips.map(type => <button key={type} type="button" className={jobFilters.type === type ? 'selected' : ''} onClick={() => setSingleFilter('type', jobFilters.type === type ? '' : type)}><BriefcaseBusiness size={15} />{type}</button>)}
                    </nav>}

                    <div className="jobs-reference-filter-row">
                        <button type="button" className={`jobs-filter-trigger${filtersOpen ? ' is-open' : ''}`} onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen}><Filter size={15} />Filters <span>{activeFilters}</span><ChevronDown size={14} /></button>
                        <label className="jobs-select-filter"><span>Type</span><select value={jobFilters.type || ''} onChange={event => setSingleFilter('type', event.target.value)}><option value="">All types</option>{jobTypes.map(type => <option key={type} value={type}>{type}</option>)}</select></label>
                        <label className="jobs-select-filter"><MapPin size={14} /><select aria-label="Location" value={Array.isArray(jobFilters.location) ? jobFilters.location[0] || '' : jobFilters.location || ''} onChange={event => setSingleFilter('location', event.target.value)}><option value="">Location</option>{locations.map(location => <option key={location} value={location}>{location}</option>)}</select></label>
                        <label className="jobs-select-filter"><BriefcaseBusiness size={14} /><select aria-label="Roles" value={Array.isArray(jobFilters.industry) ? jobFilters.industry[0] || '' : jobFilters.industry || ''} onChange={event => setSingleFilter('industry', event.target.value)}><option value="">Roles</option>{roles.map(role => <option key={role} value={role}>{role}</option>)}</select></label>
                    </div>

                    {filtersOpen && <div className="jobs-reference-filter-panel"><FilterCard /></div>}

                    <section className="jobs-reference-results" aria-label="Job listings">
                        {filteredJobs.length ? filteredJobs.map(job => <JobCard key={job._id} job={job} />) : <div className="job-feed-empty"><Search size={24} /><h2>No jobs found</h2><p>Try another search or clear some filters to see more openings.</p><button type="button" onClick={() => { setSingleFilter('type', ''); setSingleFilter('location', ''); setSingleFilter('industry', ''); setSingleFilter('salary', []); setSingleFilter('experience', '') }}>Clear filters</button></div>}
                    </section>
                </div>

                <aside className="jobs-reference-featured jobs-ai-suggestions" aria-label="AI job suggestions">
                    <h2><Sparkles size={16} />Jobs picked for your resume</h2>
                    <p className="jobs-ai-intro">Personalized matches based on your resume and skills.</p>
                    {user?.role === 'student' ? <div className="jobs-reference-featured-list">
                        {recommendationState.loading && <p className="jobs-ai-state">Finding roles that match your resume…</p>}
                        {recommendationState.error && <div className="jobs-ai-state"><p>{recommendationState.error}</p><Link to="/profile"><FileUp size={15} />Upload or update resume</Link></div>}
                        {!recommendationState.loading && !recommendationState.error && recommendationState.recommendations.length > 0 && recommendationState.recommendations.map(job => <Link to={`/description/${job._id}`} className="jobs-reference-featured-item jobs-ai-item" key={job._id}>
                            <span className="jobs-reference-featured-logo">{job.company?.logo ? <img src={job.company.logo} alt="" /> : <Building2 size={18} />}</span>
                            <span className="jobs-ai-item-copy"><strong>{job.title}</strong><small>{(job.company?.name || 'Open role') + (job.location ? ' · ' + job.location : '')}</small><small>{job.reason}</small><b>{job.matchScore}% match{recommendationState.mode === 'ai' ? ' · AI' : ''}</b></span>
                        </Link>)}
                        {!recommendationState.loading && !recommendationState.error && recommendationState.recommendations.length === 0 && <div className="jobs-ai-state">
                            {!recommendationState.hasResume ? <><p>Upload a resume to get job suggestions matched to your experience.</p><Link to="/profile"><FileUp size={15} />Upload resume</Link></>
                                : !recommendationState.hasRecommendations ? <><p>Analyze your resume or update your skills to generate your top job matches.</p><Link to="/resume-checker"><Sparkles size={15} />Analyze my resume</Link></>
                                    : <p>No matching open roles yet. We’ll refresh your suggestions when your skills change.</p>}
                        </div>}
                    </div> : <div className="jobs-ai-state"><p>Sign in with a candidate account and upload your resume to get personalized job suggestions.</p><Link to="/login">Sign in to get suggestions <ArrowRight size={14} /></Link></div>}
                </aside>
            </main>
        </OpportunityLayout>
    )
}

export default Jobs
