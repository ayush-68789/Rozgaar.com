import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, BriefcaseBusiness, Search } from 'lucide-react'
import OpportunityLayout from '../components/shared/OpportunityLayout'
import { useApp } from '@/context/AppContext'
import { JOB_API_END_POINT } from '@/utils/constant'

const CompaniesDirectory = () => {
    const { allJobs, setAllJobs, setSearchedQuery, setJobFilters } = useApp()
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        let active = true
        const fetchCompanies = async () => {
            setLoading(true)
            try {
                const response = await axios.get(`${JOB_API_END_POINT}/get`, { withCredentials: true })
                if (active && response.data.success) setAllJobs(response.data.jobs || [])
            } catch (error) {
                console.error(error)
            } finally {
                if (active) setLoading(false)
            }
        }
        fetchCompanies()
        return () => { active = false }
    }, [setAllJobs])

    const companies = useMemo(() => {
        const companyMap = new Map()
        allJobs.forEach(job => {
            const company = job.company
            if (!company?._id || !company.name) return
            const entry = companyMap.get(company._id) || { ...company, openJobs: 0, totalJobs: 0 }
            entry.totalJobs += 1
            if (job.isOpen !== false) entry.openJobs += 1
            companyMap.set(company._id, entry)
        })
        return [...companyMap.values()]
            .filter(company => company.name.toLowerCase().includes(search.trim().toLowerCase()))
            .sort((a, b) => b.openJobs - a.openJobs || a.name.localeCompare(b.name))
    }, [allJobs, search])

    const openCompanyJobs = (companyName) => {
        setSearchedQuery(companyName)
        setJobFilters({ location: '', industry: '', salary: '', experience: '' })
        navigate('/jobs')
    }

    return (
        <OpportunityLayout activePage="Companies" breadcrumb="Companies" searchPlaceholder="Search companies" showFooter>
        <div className="app-page companies-directory-page">
            <main className="companies-directory-main">
                <header className="companies-directory-heading">
                    <div><h1>Explore companies</h1><p>Discover companies and see who is hiring right now.</p></div>
                    <div className="companies-directory-search"><Search size={17} /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search companies" aria-label="Search companies" /></div>
                </header>
                {!loading && <p className="companies-directory-count">{companies.length} {companies.length === 1 ? 'company' : 'companies'}</p>}
                {loading ? <div className="companies-directory-empty" role="status">Loading companies…</div> : companies.length ? <div className="companies-directory-grid">
                    {companies.map(company => <button type="button" className="directory-company-card" key={company._id} onClick={() => openCompanyJobs(company.name)}>
                        <span className="directory-company-logo">{company.logo ? <img src={company.logo} alt={`${company.name} logo`} /> : <span>{company.name.charAt(0).toUpperCase()}</span>}</span>
                        <span className="directory-company-content"><strong>{company.name}</strong><span className={`directory-hiring-status${company.openJobs ? ' is-hiring' : ''}`}><i />{company.openJobs ? 'Currently hiring' : 'Not hiring right now'}</span></span>
                        <span className="directory-company-openings"><BriefcaseBusiness size={15} />{company.openJobs} {company.openJobs === 1 ? 'open role' : 'open roles'}</span>
                        <ArrowRight className="directory-company-arrow" size={17} />
                    </button>)}
                </div> : <div className="companies-directory-empty"><Building2 size={22} /><strong>{search ? 'No companies match that search.' : 'No companies to show yet.'}</strong><span>Companies will appear here when they have posted a job.</span></div>}
            </main>
        </div>
        </OpportunityLayout>
    )
}

export default CompaniesDirectory
