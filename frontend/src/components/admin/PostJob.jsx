import { useEffect, useState } from 'react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useApp } from '@/context/AppContext'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import axios from 'axios'
import { JOB_API_END_POINT } from '@/utils/constant'
import { toast } from 'react-toastify'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BriefcaseBusiness, Loader2 } from 'lucide-react'
import useGetAllCompanies from '@/hooks/useGetAllCompanies'

const PostJob = () => {
    const { id: jobId } = useParams();
    const isEditing = Boolean(jobId);
    const [input, setInput] = useState({
        title: "",
        description: "",
        requirements: "",
        salary: "",
        salaryUnit: "INR",
        salaryPeriod: "month",
        location: "",
        jobType: "",
        experience: "",
        position: 0,
        applicationDeadline: "",
        companyId: ""
    });
    const [loading, setLoading]= useState(false);
    const [loadingJob, setLoadingJob] = useState(isEditing);
    const navigate = useNavigate();

    const companiesLoading = useGetAllCompanies();
    const { companies } = useApp();
    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const selectChangeHandler = (companyId) => {
        setInput(current => ({ ...current, companyId }));
    };

    useEffect(() => {
        if (!jobId) return;
        let active = true;
        const fetchJob = async () => {
            try {
                const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, { withCredentials: true });
                if (!res.data.success) throw new Error('Job not found.');
                const job = res.data.job;
                if (active) setInput({
                    title: job.title || '',
                    description: job.description || '',
                    requirements: Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements || '',
                    salary: job.salary ?? '',
                    salaryUnit: job.salaryUnit || 'LPA',
                    salaryPeriod: job.salaryPeriod || 'year',
                    location: job.location || '',
                    jobType: job.jobType || '',
                    experience: String(job.experienceLevel ?? ''),
                    position: job.position ?? 1,
                    applicationDeadline: job.applicationDeadline ? String(job.applicationDeadline).slice(0, 10) : '',
                    companyId: job.company?._id || job.company || ''
                });
            } catch (error) {
                toast.error(error.response?.data?.message || error.message || 'Failed to load job.');
                navigate('/admin/jobs');
            } finally {
                if (active) setLoadingJob(false);
            }
        };
        fetchJob();
        return () => { active = false; };
    }, [jobId, navigate]);

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await axios({
                method: isEditing ? 'patch' : 'post',
                url: isEditing ? `${JOB_API_END_POINT}/update/${jobId}` : `${JOB_API_END_POINT}/post`,
                data: input,
                headers:{
                    'Content-Type':'application/json'
                },
                withCredentials:true
            });
            if(res.data.success){
                toast.success(res.data.message);
                navigate("/admin/jobs");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred");
        } finally{
            setLoading(false);
        }
    }

    return (
        <div className="app-page admin-page">
            <div className='admin-form-layout recruiter-posting-layout'>
                <button type="button" className="recruiter-back-link" onClick={() => navigate('/admin/jobs')}><ArrowLeft size={16} /> Back to jobs</button>
                <form onSubmit = {submitHandler} className='admin-form-card recruiter-posting-card'>
                    <div className="admin-form-heading recruiter-posting-heading"><span className="recruiter-heading-icon"><BriefcaseBusiness size={18} /></span><h1>{isEditing ? 'Edit job' : 'Post a new job'}</h1><p>{isEditing ? 'Update the details candidates see for this role.' : 'Share the role details to reach the right candidates.'}</p></div>
                    <div className='grid grid-cols-2 gap-2 recruiter-job-grid'>
                        <div>
                            <Label htmlFor="job-title">Job title</Label>
                            <Input
                                id="job-title"
                                type="text"
                                name="title"
                                value={input.title}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="job-description">Job description</Label>
                            <textarea
                                id="job-description"
                                name="description"
                                value={input.description}
                                onChange={changeEventHandler}
                                rows="3"
                                placeholder="Describe the role, team, and impact"
                            />
                        </div>
                        <div>
                            <Label htmlFor="job-requirements">Key requirements</Label>
                            <textarea
                                id="job-requirements"
                                name="requirements"
                                value={input.requirements}
                                onChange={changeEventHandler}
                                rows="3"
                                placeholder="Skills, qualifications, and experience"
                            />
                        </div>
                        <div>
                            <Label htmlFor="salary">Salary amount</Label>
                            <div className="salary-input-row">
                                <Input
                                    id="salary"
                                    type="number"
                                    name="salary"
                                    min="0"
                                    step="any"
                                    inputMode="decimal"
                                    placeholder="e.g. 50000"
                                    value={input.salary}
                                    onChange={changeEventHandler}
                                    required
                                    className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                                />
                                <Select value={`${input.salaryUnit}-${input.salaryPeriod}`} onValueChange={value => {
                                    const [salaryUnit, salaryPeriod] = value.split('-');
                                    setInput(current => ({ ...current, salaryUnit, salaryPeriod }));
                                }}>
                                    <SelectTrigger aria-label="Salary currency and period" className="salary-format-select"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INR-month">₹ per month</SelectItem>
                                        <SelectItem value="INR-year">₹ per year</SelectItem>
                                        <SelectItem value="LPA-year">LPA per year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="salary-input-hint">Enter numbers only, then choose the currency unit and pay period.</p>
                        </div>
                        <div>
                            <Label htmlFor="job-location">Location</Label>
                            <Input
                                id="job-location"
                                type="text"
                                name="location"
                                value={input.location}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="job-type">Job type</Label>
                            <Input
                                id="job-type"
                                type="text"
                                name="jobType"
                                value={input.jobType}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="job-experience">Experience level</Label>
                            <Input
                                id="job-experience"
                                type="text"
                                name="experience"
                                placeholder="e.g. 2 - 4 years, or 0 for entry level"
                                value={input.experience}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="job-positions">Number of openings</Label>
                            <Input
                                id="job-positions"
                                type="number"
                                name="position"
                                value={input.position}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="application-deadline">Last date to apply</Label>
                            <Input
                                id="application-deadline"
                                type="date"
                                name="applicationDeadline"
                                value={input.applicationDeadline}
                                min={new Date().toISOString().slice(0, 10)}
                                onChange={changeEventHandler}
                                required
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                            <p className="salary-input-hint">Candidates can apply through this date. Edit the date later to extend the deadline.</p>
                        </div>
                        {
                            <div className="company-select-field">
                                <Label htmlFor="job-company">Hiring company</Label>
                                {companiesLoading ? <p className="company-loading">Loading your companies…</p> : companies.length > 0 ? (
                                    <Select value={input.companyId} onValueChange={selectChangeHandler}>
                                        <SelectTrigger id="job-company" className="w-full"><SelectValue placeholder="Select a company" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>{companies.map(company => <SelectItem key={company._id} value={company._id}>{company.name}</SelectItem>)}</SelectGroup>
                                        </SelectContent>
                                    </Select>
                                ) : <p className="company-loading">No company registered yet.</p>}
                            </div>
                        }
                    </div> 
                    {loadingJob && <div className="company-loading">Loading job details…</div>}
                    {
                        loading ? <Button type="button" disabled className="w-full my-4"><Loader2 className='mr-2 h-4 w-4 animate-spin' />Please wait</Button> : (
                            <Button type="submit" disabled={loadingJob || companiesLoading || companies.length === 0 || !input.companyId} className="w-full my-4">{isEditing ? 'Save Changes' : 'Post New Job'}</Button>
                        )
                    }
                    {
                        !companiesLoading && companies.length === 0 && <div className="company-required-message"><p>You need to register a company before posting a job.</p><Button type="button" variant="outline" onClick={() => navigate('/admin/companies/create')}>Register a company</Button></div>
                    }
                </form>
            </div>
        </div>
    )
}

export default PostJob
