import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { ArrowRight, Building2, MapPin } from 'lucide-react'
import { formatSalary } from '@/utils/salary'

const LatestJobs = () => {
    const { allJobs } = useApp();
    const navigate = useNavigate();
    const [visibleCount, setVisibleCount] = useState(4);
    const availableJobs = allJobs || [];
    const jobs = availableJobs.slice(0, visibleCount);

    return <section className="content-section jobs-section" id="featured-jobs">
        <div className="section-heading unstop-featured-heading"><div><h2>Featured</h2></div><button className="text-link" onClick={() => navigate('/jobs')}>View all <ArrowRight size={16} /></button></div>
        {jobs.length ? <>
            <div className="featured-grid">{jobs.map((job, index) => <article className={`featured-card unstop-featured-card feature-${index % 4}`} key={job._id} onClick={() => navigate(`/description/${job._id}`)}>
            <div className="unstop-featured-art">
                <span className="unstop-featured-kind">Hiring now</span>
                <div className="unstop-featured-company-mark">{job.company?.logo ? <img src={job.company.logo} alt="" /> : <Building2 size={38} />}</div>
                <div className="unstop-featured-art-copy"><small>Featured opportunity</small><strong>{job.title}</strong></div>
            </div>
            <p className="company-name">{job.company?.name || 'Company'}</p><h3>{job.title}</h3><div className="job-location"><MapPin size={14} />{job.location || 'Location not specified'}</div>
            <div className="job-tags">{job.jobType && <span>{job.jobType}</span>}{job.position && <span>{job.position} openings</span>}{job.salary !== undefined && <span>{formatSalary(job)}</span>}</div>
            <div className="job-card-link">View details <ArrowRight size={15} /></div>
        </article>)}</div>
            {availableJobs.length > visibleCount && <div className="featured-load-more-wrap"><button type="button" className="featured-load-more" onClick={() => setVisibleCount(count => count + 4)}>Show more jobs <ArrowRight size={15} /></button></div>}
        </> : <div className="empty-jobs"><Building2 size={26} /><strong>No job listings yet</strong><span>New openings will appear here when a company posts them.</span></div>}
    </section>
}

export default LatestJobs
