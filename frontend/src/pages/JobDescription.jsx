import { useEffect, useState } from 'react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { APPLICATION_API_END_POINT, JOB_API_END_POINT } from '@/utils/constant'
import { useApp } from '@/context/AppContext'
import { toast } from 'react-toastify'
import OpportunityLayout from '../components/shared/OpportunityLayout'
import { motion } from 'framer-motion'
import { formatSalary } from '@/utils/salary'
import { Building2, MapPin, Users, CalendarDays, ExternalLink } from 'lucide-react'
import FitPanel from '../components/coach/FitPanel'

const JobDescription = () => {
    const { singleJob, setSingleJob, user } = useApp();
    const params = useParams();
    const jobId = params.id;

    const [isApplied, setIsApplied] = useState(Boolean(singleJob?.hasApplied));
    const deadlineDate = singleJob?.applicationDeadline ? String(singleJob.applicationDeadline).slice(0, 10) : '';
    const originalDeadlineDate = singleJob?.originalApplicationDeadline ? String(singleJob.originalApplicationDeadline).slice(0, 10) : '';
    const deadlineEnd = deadlineDate ? new Date(`${deadlineDate}T23:59:59.999Z`).getTime() : Infinity;
    const isDeadlinePassed = Date.now() > deadlineEnd;
    const isJobClosed = singleJob?.isOpen === false;
    const areApplicationsClosed = isJobClosed || isDeadlinePassed;
    const wasDeadlineExtended = Boolean(originalDeadlineDate && deadlineDate > originalDeadlineDate);
    const deadlineLabel = deadlineDate
        ? new Date(`${deadlineDate}T00:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Not set';
    const requirements = Array.isArray(singleJob?.requirements)
        ? singleJob.requirements.flatMap(value => String(value).split(/[,•]/)).map(value => value.trim()).filter(Boolean)
        : [];
    const postedDate = singleJob?.createdAt ? new Date(singleJob.createdAt) : null;
    const postedDateLabel = postedDate && !Number.isNaN(postedDate.getTime())
        ? postedDate.toISOString().slice(0, 10)
        : 'Not available';

    const applyJobHandler = async () => {
        if (areApplicationsClosed) return;
        try {
            const res = await axios.post(`${APPLICATION_API_END_POINT}/apply/${jobId}`, {}, { withCredentials: true });
            if (res.data.success) {
                setIsApplied(true);
                const updatedSingleJob = { ...singleJob, hasApplied: true, applicationsCount: (singleJob.applicationsCount || 0) + 1 };
                setSingleJob(updatedSingleJob);
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Failed to apply.");
        }
    }

    useEffect(() => {
        const fetchSingleJob = async () => {
            try {
                const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, { withCredentials: true });
                if (res.data.success) {
                    setSingleJob(res.data.job);
                    setIsApplied(Boolean(res.data.job.hasApplied));
                }
            } catch (error) {
                console.log(error);
                toast.error(error.response?.data?.message || "Failed to load job details.");
            }
        }
        fetchSingleJob();
    }, [jobId, setSingleJob, user?._id]);

    return (
        <OpportunityLayout activePage="Jobs" breadcrumb="Job details" searchPlaceholder="Search Jobs">
        <div className="app-page description-page">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className='description-layout job-description-card'
            >
                <div className='job-description-header'>
                    <div className='job-description-heading'>
                        <h1>{singleJob?.title || 'Job details'}</h1>
                        <div className='job-description-facts'>
                            <Badge variant="ghost" className="job-fact-position">{singleJob?.position || 0} Positions</Badge>
                            <Badge variant="ghost" className="job-fact-type">{singleJob?.jobType || 'Job type not specified'}</Badge>
                            <Badge variant="ghost" className="job-fact-salary">{formatSalary(singleJob)}</Badge>
                        </div>
                    </div>
                    <div className='job-description-apply-group'>
                        <Button
                            onClick={isApplied ? null : applyJobHandler}
                            disabled={isApplied || areApplicationsClosed}
                            className={`job-description-apply rounded-lg ${(isApplied || areApplicationsClosed) ? 'bg-gray-500 cursor-not-allowed text-white' : 'bg-[#1769d2] hover:bg-[#1253ad] text-white'}`}>
                            {isApplied ? 'Already Applied' : areApplicationsClosed ? 'Applications Closed' : 'Apply Now'}
                        </Button>
                        <div className='job-description-apply-stats'>
                            <span>{singleJob?.position || 0} opening{Number(singleJob?.position) === 1 ? '' : 's'}</span>
                            <span>{singleJob?.applicationsCount || 0} applicants</span>
                        </div>
                        {deadlineDate && <div className={`job-deadline-status ${areApplicationsClosed ? 'is-closed' : wasDeadlineExtended ? 'is-extended' : ''}`}>
                            {areApplicationsClosed ? 'Applications closed' : wasDeadlineExtended ? 'Deadline extended' : 'Last date to apply'} · {deadlineLabel}
                        </div>}
                    </div>
                </div>
                <section className='job-description-section'>
                    <h2>Job Description</h2>
                    <div className='job-description-rule' />
                    <dl className='job-description-details'>
                        <div><dt>Role:</dt><dd>{singleJob?.title || 'Not specified'}</dd></div>
                        <div><dt>Location:</dt><dd className='job-detail-with-icon'><MapPin size={15} />{singleJob?.location || 'Not specified'}</dd></div>
                        <div><dt>Description:</dt><dd>{singleJob?.description || 'No description provided.'}</dd></div>
                        <div><dt>Experience:</dt><dd>{Number(singleJob?.experienceLevel) || 0} yrs</dd></div>
                        <div><dt>Salary:</dt><dd>{formatSalary(singleJob)}</dd></div>
                        {deadlineDate && <div><dt>Application deadline:</dt><dd>{deadlineLabel}{wasDeadlineExtended && <span className='job-deadline-tag'>Extended</span>}{areApplicationsClosed && <span className='job-deadline-tag is-closed'>Applications closed</span>}</dd></div>}
                        <div><dt>Total Applicants:</dt><dd className='job-detail-with-icon'><Users size={15} />{singleJob?.applicationsCount || 0}</dd></div>
                        <div><dt>Posted Date:</dt><dd className='job-detail-with-icon'><CalendarDays size={15} />{postedDateLabel}</dd></div>
                    </dl>
                </section>

                {requirements.length > 0 && <section className='job-description-section job-requirements-section'>
                    <h2>Skills and requirements</h2>
                    <div className='job-requirement-list'>
                        {requirements.map((requirement, index) => <span key={`${requirement}-${index}`}>{requirement}</span>)}
                    </div>
                </section>}

                {user?.role === 'student' && singleJob?._id && <FitPanel key={jobId} jobId={jobId} />}

                {singleJob?.company && <section className='job-description-section job-company-section'>
                    <h2>About {singleJob.company.name || 'the company'}</h2>
                    <div className='job-company-info'>
                        {singleJob.company.location && <span><Building2 size={15} />{singleJob.company.location}</span>}
                        {singleJob.company.website && <a href={singleJob.company.website} target='_blank' rel='noreferrer'>Company website <ExternalLink size={14} /></a>}
                    </div>
                    {singleJob.company.description && <p>{singleJob.company.description}</p>}
                </section>}

            </motion.div>
        </div>
        </OpportunityLayout>
    )
}

export default JobDescription
