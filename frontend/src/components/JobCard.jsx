import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Banknote, Building2, CalendarDays, ClipboardList, MapPin, BriefcaseBusiness } from 'lucide-react'
import { formatSalary } from '@/utils/salary'
import { useApp } from '@/context/AppContext'

const JobCard = ({ job }) => {
    const navigate = useNavigate();
    const { allJobs } = useApp();
    const [logoFailed, setLogoFailed] = useState(false);
    const createdAt = job?.createdAt ? new Date(job.createdAt) : null;
    const postedLabel = createdAt && !Number.isNaN(createdAt.getTime())
        ? `Posted ${createdAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
        : 'Posted date unavailable';
    const requirements = Array.isArray(job?.requirements)
        ? job.requirements.flatMap(value => String(value).split(/[,•]/)).map(value => value.trim()).filter(Boolean)
        : [];
    const experience = Number(job?.experienceLevel);
    const experienceLabel = experience > 0 ? `${experience} year${experience === 1 ? '' : 's'}${experience === 1 ? '' : '+'} experience` : 'No experience required';
    const location = job?.location || 'Location not specified';
    const isRemote = /remote|work from home|wfh/i.test(`${location} ${job?.jobType || ''}`);
    const deadlineDate = job?.applicationDeadline ? String(job.applicationDeadline).slice(0, 10) : '';
    const deadlineEnd = deadlineDate ? new Date(`${deadlineDate}T23:59:59.999Z`).getTime() : Infinity;
    const deadlinePassed = Date.now() > deadlineEnd;
    const open = job?.isOpen !== false && !deadlinePassed;
    const companyId = String(job?.company?._id || job?.company || '');
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const recentCompanyPostCount = allJobs.filter(companyJob => {
        const postedAt = new Date(companyJob?.createdAt).getTime();
        const listedCompanyId = String(companyJob?.company?._id || companyJob?.company || '');
        return companyId && listedCompanyId === companyId && Number.isFinite(postedAt) && postedAt >= oneYearAgo && postedAt <= Date.now();
    }).length;
    const activelyHiring = open && recentCompanyPostCount > 2;
    const originalDeadlineDate = job?.originalApplicationDeadline ? String(job.originalApplicationDeadline).slice(0, 10) : '';
    const deadlineExtended = Boolean(originalDeadlineDate && deadlineDate > originalDeadlineDate);
    const deadlineLabel = deadlineDate
        ? new Date(`${deadlineDate}T00:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : '';

    const openDetails = () => navigate(`/description/${job?._id}`);

    return (
        <motion.article
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18 }}
            className='job-feed-card'
            onClick={openDetails}
            onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openDetails();
                }
            }}
            role='link'
            tabIndex={0}
            aria-label={`View ${job?.title || 'job'} at ${job?.company?.name || 'company'}`}
        >
            <div className='job-feed-card-main'>
                <div className='job-feed-card-copy'>
                    <h2 className='job-feed-title'>{job?.title || 'Untitled role'}</h2>
                    <div className='job-feed-company-line'>
                        <span className='job-feed-company'>{job?.company?.name || 'Company not specified'}</span>
                        <span className={`job-hiring-badge ${!open ? 'is-closed' : !activelyHiring ? 'is-open' : ''}`}>{!open ? 'Not hiring' : activelyHiring ? 'Actively hiring' : 'Open'}</span>
                    </div>
                </div>
                <div className='job-feed-logo' aria-hidden='true'>
                    {job?.company?.logo && !logoFailed
                        ? <img src={job.company.logo} alt='' onError={() => setLogoFailed(true)} />
                        : <Building2 size={25} strokeWidth={1.8} />}
                </div>
            </div>

            <div className='job-feed-meta'>
                <span><MapPin size={14} />{isRemote ? 'Work from home' : location}</span>
                <span><Banknote size={14} />{formatSalary(job)}</span>
                <span><BriefcaseBusiness size={14} />{experienceLabel}</span>
                {deadlineDate && <span className={deadlinePassed || job?.isOpen === false ? 'job-card-deadline-closed' : deadlineExtended ? 'job-card-deadline-extended' : ''}>
                    <CalendarDays size={14} />{deadlinePassed || job?.isOpen === false ? 'Applications closed' : `Apply by ${deadlineLabel}${deadlineExtended ? ' · Extended' : ''}`}
                </span>}
            </div>

            <p className='job-feed-description'><ClipboardList size={14} />{job?.description || 'No description provided.'}</p>

            {requirements.length > 0 && (
                <div className='job-feed-skills' aria-label='Key skills'>
                    {requirements.map((requirement, index) => <span key={`${requirement}-${index}`}>{requirement}</span>)}
                </div>
            )}

            <div className='job-feed-footer'>
                <span className='job-posted-badge'><CalendarDays size={13} />{postedLabel}</span>
                {job?.jobType && <><i aria-hidden='true' /> <span>{job.jobType}</span></>}
                {Number(job?.position) > 0 && <><i aria-hidden='true' /> <span>{job.position} opening{Number(job.position) === 1 ? '' : 's'}</span></>}
            </div>
        </motion.article>
    )
}

export default JobCard
