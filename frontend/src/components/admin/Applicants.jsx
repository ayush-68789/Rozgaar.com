import { useEffect, useMemo, useState } from 'react'
import ApplicantsTable from './ApplicantsTable'
import axios from 'axios';
import { APPLICATION_API_END_POINT, JOB_API_END_POINT } from '@/utils/constant';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { toast } from 'react-toastify';
import { BriefcaseBusiness, Building2, CheckCircle2, Eye, Loader2, Search, Sparkles } from 'lucide-react';

const Applicants = () => {
    const params = useParams();
    const { applicants, setAllApplicants, allAdminJobs, setAllAdminJobs } = useApp();
    const [loading, setLoading] = useState(true);
    const [jobsLoading, setJobsLoading] = useState(!params.id);
    const [companyFilter, setCompanyFilter] = useState('all');
    const [shortlistCount, setShortlistCount] = useState(3);
    const [shortlistLoading, setShortlistLoading] = useState(false);
    const [shortlistResult, setShortlistResult] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        setAllApplicants(null);
        if (!params.id) {
            setJobsLoading(true);
            axios.get(`${JOB_API_END_POINT}/getadminjobs`, { withCredentials: true })
                .then(res => {
                    if (res.data.success) setAllAdminJobs(res.data.jobs || []);
                })
                .catch(error => toast.error(error.response?.data?.message || 'Failed to load your jobs.'))
                .finally(() => setJobsLoading(false));
            setLoading(false);
            return;
        }
        setLoading(true);
        const fetchAllApplicants = async () => {
            try {
                const res = await axios.get(`${APPLICATION_API_END_POINT}/${params.id}/applicants`, { withCredentials: true });
                if (res.data.success) setAllApplicants(res.data.job);
            } catch (error) {
                console.log(error);
                toast.error(error.response?.data?.message || "Failed to load applicants.");
            } finally {
                setLoading(false);
            }
        }
        fetchAllApplicants();
    }, [params.id, setAllApplicants, setAllAdminJobs]);

    const companies = useMemo(() => [...new Set(allAdminJobs.map(job => job.company?.name).filter(Boolean))].sort(), [allAdminJobs]);
    const filteredJobs = useMemo(() => allAdminJobs.filter(job => companyFilter === 'all' || job.company?.name === companyFilter), [allAdminJobs, companyFilter]);
    const isCurrentJob = String(applicants?._id || '') === String(params.id || '');
    const eligibleApplications = isCurrentJob ? (applicants?.applications || []).filter(application => ['pending', 'shortlisted'].includes(application.status)) : [];

    useEffect(() => {
        if (applicants?._id) {
            setShortlistCount(Math.max(1, Math.min(3, eligibleApplications.length)));
            setShortlistResult(null);
        }
    }, [applicants?._id]);

    const runAiShortlist = async () => {
        if (!params.id || eligibleApplications.length === 0) return;
        try {
            setShortlistLoading(true);
            const res = await axios.post(`${APPLICATION_API_END_POINT}/shortlist/${params.id}`, { count: shortlistCount }, { withCredentials: true });
            if (!res.data.success) return;
            const updatedStatuses = new Map((res.data.updatedApplications || []).map(item => [item.id, item.status]));
            setAllApplicants(current => current ? {
                ...current,
                applications: current.applications.map(application => updatedStatuses.has(application._id)
                    ? { ...application, status: updatedStatuses.get(application._id) }
                    : application)
            } : current);
            setShortlistResult(res.data);
            toast.success(`${res.data.shortlistedCount} candidate${res.data.shortlistedCount === 1 ? '' : 's'} shortlisted.`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'AI shortlisting failed. Please try again.');
        } finally {
            setShortlistLoading(false);
        }
    };

    if (!params.id) return (
        <div className="app-page admin-page">
            <div className="admin-content applicants-content">
                <div className="applicants-heading">
                    <div><h1>Applicants</h1><p>Choose a company and job to review its applicants.</p></div>
                    <div className="applicants-count"><strong>{filteredJobs.length}</strong><span>{filteredJobs.length === 1 ? 'Job' : 'Jobs'}</span></div>
                </div>
                <div className="applicant-directory-toolbar">
                    <label className="applicant-company-filter"><Building2 size={17} /><span>Company</span>
                        <select value={companyFilter} onChange={event => setCompanyFilter(event.target.value)} aria-label="Filter applicants by company">
                            <option value="all">All companies</option>
                            {companies.map(company => <option key={company} value={company}>{company}</option>)}
                        </select>
                    </label>
                    <span className="applicant-directory-hint"><Search size={15} /> Select a job to see its applicants and update application status.</span>
                </div>
                {jobsLoading ? <div className="applicants-loading" role="status">Loading your jobs…</div> : filteredJobs.length ? <div className="applicant-job-list">
                    {filteredJobs.map(job => <article className="applicant-job-card" key={job._id}>
                        <div className="applicant-job-icon"><BriefcaseBusiness size={19} /></div>
                        <div className="applicant-job-info"><h2>{job.title}</h2><p>{job.company?.name || 'Company not set'}</p></div>
                        <span className="applicant-job-count">{job.applications?.length || 0} {(job.applications?.length || 0) === 1 ? 'applicant' : 'applicants'}</span>
                        <button type="button" className="applicant-view-button" onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)}><Eye size={16} /> View applicants</button>
                    </article>)}
                </div> : <div className="applicants-empty"><BriefcaseBusiness size={24} /><strong>{allAdminJobs.length ? 'No jobs for this company' : 'No jobs posted yet'}</strong><span>{allAdminJobs.length ? 'Choose another company to see its openings.' : 'Post a job to start receiving applicants.'}</span></div>}
            </div>
        </div>
    );

    return (
        <div className="app-page admin-page">
            <div className='admin-content applicants-content'>
                <div className="applicants-heading">
                    <div>
                        <h1>Applicants</h1>
                        <p>{applicants?.title ? `Review candidates for ${applicants.title}.` : 'Review and manage candidates for this job.'}</p>
                    </div>
                    <div className="applicants-count"><strong>{applicants?.applications?.length || 0}</strong><span>{applicants?.applications?.length === 1 ? 'Applicant' : 'Applicants'}</span></div>
                </div>
                {eligibleApplications.length > 0 && <section className="ai-shortlist-panel">
                    <div className="ai-shortlist-intro"><span className="ai-shortlist-icon"><Sparkles size={19} /></span><div><h2>AI shortlist</h2><p>Rank candidates by skills extracted from their resumes and saved on their profiles against this job’s requirements.</p></div></div>
                    <div className="ai-shortlist-controls"><label htmlFor="shortlist-count">Shortlist top</label><input id="shortlist-count" type="number" min="1" max={eligibleApplications.length} value={Math.min(shortlistCount, eligibleApplications.length)} onChange={event => setShortlistCount(Math.max(1, Math.min(eligibleApplications.length, Number(event.target.value) || 1)))} /><span>of {eligibleApplications.length} candidates</span><button type="button" onClick={runAiShortlist} disabled={shortlistLoading || loading || eligibleApplications.length === 0}>{shortlistLoading ? <><Loader2 size={16} className="animate-spin" /> Shortlisting…</> : <><Sparkles size={16} /> Shortlist candidates</>}</button></div>
                    <p className="ai-shortlist-note">Only pending and currently shortlisted candidates are considered. Candidates outside your new shortlist return to review.</p>
                    {shortlistResult && <div className="ai-shortlist-results"><div className="ai-shortlist-result-heading"><strong><CheckCircle2 size={16} /> {shortlistResult.shortlistedCount} candidates shortlisted</strong><span>{shortlistResult.aiUsed ? 'AI ranked' : 'AI unavailable · skill-match fallback'}</span></div><div className="ai-shortlist-result-list">{shortlistResult.shortlisted.map((item, index) => {
                        const application = applicants?.applications?.find(candidate => candidate._id === item.applicationId);
                        return <article key={item.applicationId}><span className="ai-shortlist-rank">{index + 1}</span><div><strong>{application?.applicant?.fullname || 'Candidate'}</strong><small>{item.reason}</small></div><span className="ai-shortlist-score">{item.matchScore}% match</span></article>;
                    })}</div></div>}
                </section>}
                {loading ? <div className="applicants-loading" role="status">Loading applicants…</div> : <ApplicantsTable />}
            </div>
        </div>
    )
}

export default Applicants
