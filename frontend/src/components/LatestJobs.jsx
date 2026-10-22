import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { ArrowRight, Building2, MapPin } from 'lucide-react'
import { formatSalary } from '@/utils/salary'

const LatestJobs = () => {
    const { allJobs } = useApp();
    const navigate = useNavigate();
    const jobs = allJobs?.slice(0, 8) || [];

    return <section className="content-section jobs-section" id="featured-jobs">
        <div className="section-heading"><div><h2>Featured jobs</h2><p>Open roles from companies hiring on Rozgaar.com.</p></div><button className="text-link" onClick={() => navigate('/jobs')}>View all jobs <ArrowRight size={16} /></button></div>
        {jobs.length ? <div className="featured-grid">{jobs.map((job) => <article className="featured-card" key={job._id} onClick={() => navigate(`/description/${job._id}`)}>
            <div className="job-card-top"><div className="company-mark">{job.company?.logo ? <img src={job.company.logo} alt="" /> : <Building2 size={21} />}</div><span className="job-age">{job.createdAt ? `${Math.max(0, Math.floor((Date.now() - new Date(job.createdAt)) / 86400000)) === 0 ? 'Today' : `${Math.floor((Date.now() - new Date(job.createdAt)) / 86400000)} days ago`}` : 'Recently posted'}</span></div>
            <h3>{job.title}</h3><p className="company-name">{job.company?.name || 'Company'}</p><div className="job-location"><MapPin size={14} />{job.location || 'Location not specified'}</div>
            <div className="job-tags">{job.jobType && <span>{job.jobType}</span>}{job.position && <span>{job.position} openings</span>}{job.salary !== undefined && <span>{formatSalary(job)}</span>}</div>
            <div className="job-card-link">View details <ArrowRight size={15} /></div>
        </article>)}</div> : <div className="empty-jobs"><Building2 size={26} /><strong>No job listings yet</strong><span>New openings will appear here when a company posts them.</span></div>}
    </section>
}

export default LatestJobs
