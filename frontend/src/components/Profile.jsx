import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, ChevronDown, Contact, ExternalLink, FileCheck2, FileText, LogOut, Mail, Newspaper, Pen, Plus, Sparkles, Users } from 'lucide-react'
import OpportunityLayout from './shared/OpportunityLayout'
import UpdateProfileDialog from './UpdateProfileDialog'
import EditSkillsDialog from './EditSkillsDialog'
import UpdateResumeDialog from './UpdateResumeDialog'
import ProfileRecordsDialog from './ProfileRecordsDialog'
import { useApp } from '@/context/AppContext'
import { downloadResume } from '@/utils/resume'
import { coachApi, errorMessage } from '@/utils/coachApi'
import { COMPANY_API_END_POINT, JOB_API_END_POINT, USER_API_END_POINT } from '@/utils/constant'

const PROFILE_RECORD_SECTIONS = [
    { section: 'achievements', title: 'Achievements', description: 'Add awards, competitions, and other accomplishments.', fields: [
        { name: 'title', label: 'Achievement', required: true }, { name: 'organization', label: 'Organization' }, { name: 'date', label: 'Date', placeholder: 'e.g. Mar 2026' }, { name: 'description', label: 'Details', type: 'textarea' }, { name: 'link', label: 'Link', type: 'url', placeholder: 'https://' }
    ] },
    { section: 'certificates', title: 'Certificates', description: 'List certificates and professional credentials.', fields: [
        { name: 'title', label: 'Certificate', required: true }, { name: 'organization', label: 'Issuing organization' }, { name: 'date', label: 'Date', placeholder: 'e.g. Mar 2026' }, { name: 'description', label: 'Details', type: 'textarea' }, { name: 'link', label: 'Credential link', type: 'url', placeholder: 'https://' }
    ] },
    { section: 'projects', title: 'Projects', description: 'Show the projects you want recruiters to see.', fields: [
        { name: 'title', label: 'Project name', required: true }, { name: 'link', label: 'Project link', type: 'url', placeholder: 'https://' }, { name: 'skills', label: 'Skills used', placeholder: 'React, Node, MongoDB' }, { name: 'description', label: 'Description', type: 'textarea' }
    ] },
    { section: 'experience', title: 'Experience', description: 'Add roles, internships, and relevant work experience.', fields: [
        { name: 'title', label: 'Job title', required: true }, { name: 'company', label: 'Company' }, { name: 'location', label: 'Location' }, { name: 'employmentType', label: 'Employment type', placeholder: 'Internship, Full-time…' }, { name: 'startDate', label: 'Start date', placeholder: 'e.g. Jan 2025' }, { name: 'endDate', label: 'End date', placeholder: 'e.g. Mar 2026' }, { name: 'current', label: 'I currently work here', type: 'checkbox' }, { name: 'description', label: 'What you did', type: 'textarea' }
    ] },
    { section: 'education', title: 'Education', description: 'Add your schools, degrees, and fields of study.', fields: [
        { name: 'institution', label: 'School or institution', required: true }, { name: 'degree', label: 'Degree' }, { name: 'fieldOfStudy', label: 'Field of study' }, { name: 'location', label: 'Location' }, { name: 'startDate', label: 'Start date', placeholder: 'e.g. 2024' }, { name: 'endDate', label: 'End date', placeholder: 'e.g. 2028' }, { name: 'current', label: 'I currently study here', type: 'checkbox' }, { name: 'description', label: 'Details', type: 'textarea' }
    ] }
]

const ProfileNewsPanel = () => {
    const [newsOpen, setNewsOpen] = useState(true)
    const [newsState, setNewsState] = useState({ loading: true, news: [], error: '' })

    useEffect(() => {
        let active = true
        coachApi.news([]).then(result => {
            if (active) setNewsState({ loading: false, news: result.news || [], error: '' })
        }).catch(error => {
            if (active) setNewsState({ loading: false, news: [], error: errorMessage(error, 'Could not load tech news.') })
        })
        return () => { active = false }
    }, [])

    return (
        <section className={`profile-news-card${newsOpen ? ' is-open' : ''}`}>
            <button type="button" className="profile-news-toggle" onClick={() => setNewsOpen(open => !open)} aria-expanded={newsOpen}>
                <span className="profile-news-heading"><span className="profile-tool-icon"><Newspaper size={18} /></span><span><strong>Tech news</strong><small>Stories picked for your career</small></span></span>
                <ChevronDown size={17} className="profile-news-chevron" />
            </button>
            {newsOpen && <div className="profile-news-content">
                {newsState.loading && <p className="profile-news-status">Loading stories…</p>}
                {newsState.error && <p className="profile-news-status" role="status">{newsState.error}</p>}
                {!newsState.loading && !newsState.error && newsState.news.length === 0 && <p className="profile-news-status">No stories to show right now.</p>}
                {newsState.news.slice(0, 4).map(item => <a className="profile-news-item" href={item.url} key={item.id} target="_blank" rel="noreferrer"><strong>{item.title}</strong><small>{item.source} · {item.topic}</small></a>)}
                <Link to="/coach/news" className="profile-news-more"><Sparkles size={14} /> Browse all tech news <ExternalLink size={13} /></Link>
            </div>}
        </section>
    )
}

const Profile = () => {
    const [open, setOpen] = useState(false)
    const [skillsOpen, setSkillsOpen] = useState(false)
    const [resumeOpen, setResumeOpen] = useState(false)
    const [activeEditor, setActiveEditor] = useState(null)
    const { user, setUser, companies, setCompanies, allAdminJobs, setAllAdminJobs } = useApp()
    const navigate = useNavigate()
    const isRecruiter = user?.role === 'recruiter'
    const skills = user?.profile?.skills || []
    const verifiedSkills = user?.profile?.verifiedSkills || []
    const projects = user?.profile?.projects || []
    const education = user?.profile?.education || []
    const experience = user?.profile?.experience || []
    const achievements = user?.profile?.achievements || []
    const certificates = user?.profile?.certificates || []

    useEffect(() => {
        if (!isRecruiter) return
        let active = true
        Promise.all([
            axios.get(`${COMPANY_API_END_POINT}/get`, { withCredentials: true }),
            axios.get(`${JOB_API_END_POINT}/getadminjobs`, { withCredentials: true })
        ]).then(([companyResponse, jobsResponse]) => {
            if (!active) return
            if (companyResponse.data.success) setCompanies(companyResponse.data.companies || [])
            if (jobsResponse.data.success) setAllAdminJobs(jobsResponse.data.jobs || [])
        }).catch(error => {
            if (active) toast.error(error.response?.data?.message || 'Could not load your recruiter dashboard.')
        })
        return () => { active = false }
    }, [isRecruiter, setCompanies, setAllAdminJobs])

    const logoutHandler = async () => {
        try {
            const res = await axios.get(`${USER_API_END_POINT}/logout`, { withCredentials: true })
            if (res.data.success) {
                setUser(null)
                navigate('/')
                toast.success(res.data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not log out. Please try again.')
        }
    }

    return (
        <OpportunityLayout breadcrumb="My Profile">
        <div className="app-page profile-page profile-dashboard-page">
            <main className="profile-dashboard-main">
                <div className="profile-dashboard-layout">
                    <aside className="profile-dashboard-sidebar">
                        <section className="profile-identity-card">
                            <button type="button" onClick={() => setOpen(true)} className="profile-dashboard-edit" aria-label="Edit profile"><Pen size={16} /></button>
                            <Avatar className="profile-dashboard-avatar">
                                <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname || 'Profile'} />
                                <AvatarFallback>{user?.fullname?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <h1>{user?.fullname || 'Your profile'}</h1>
                            <span className="profile-role-pill">{user?.role === 'recruiter' ? 'Recruiter account' : 'Candidate profile'}</span>
                            {user?.profile?.bio && <p className="profile-dashboard-bio">{user.profile.bio}</p>}
                            <div className="profile-dashboard-contact">
                                <div><Mail size={16} /><span>{user?.email || 'Email not added'}</span></div>
                                <div><Contact size={16} /><span>{user?.phoneNumber || 'Phone not added'}</span></div>
                            </div>
                            {user?.role === 'student' && <section className="profile-dashboard-resume" aria-label="Resume">
                                <span className="profile-dashboard-resume-icon"><FileText size={18} /></span>
                                <div><strong>{user?.profile?.resumeName || 'Add your resume'}</strong><small>{user?.profile?.resumeName ? 'Ready for your applications' : 'PDF or DOCX'}</small></div>
                                {user?.profile?.resumeUrl ? <button type="button" onClick={() => downloadResume(user.profile.resumeUrl, user.profile.resumeName)} aria-label="Download resume"><ExternalLink size={15} /></button> : <button type="button" onClick={() => setResumeOpen(true)} aria-label="Upload resume"><Pen size={15} /></button>}
                            </section>}
                        </section>

                        {user?.role === 'student' && <>
                            <Link to="/resume-checker" className="profile-resume-checker-banner">
                                <span><FileCheck2 size={20} /></span>
                                <span><strong>Resume ATS Checker</strong><small>Review and improve your resume</small></span>
                                <ArrowRight size={17} />
                            </Link>
                            <div className="profile-dashboard-stats">
                                <div><span>Achievements</span><strong>{achievements.length.toString().padStart(2, '0')}</strong></div>
                                <div><span>Certificates</span><strong>{certificates.length.toString().padStart(2, '0')}</strong></div>
                            </div>
                            <ProfileNewsPanel />
                        </>}
                        <button type="button" className="profile-dashboard-logout" onClick={logoutHandler}><LogOut size={16} />Log out</button>
                    </aside>

                    <div className={`profile-dashboard-content${isRecruiter ? ' recruiter-profile-content' : ''}`}>
                        {isRecruiter ? <>
                            <section className="recruiter-profile-welcome">
                                <div><h2>Manage your hiring</h2><p>Set up your company, publish roles, and keep track of candidates in one place.</p></div>
                                <button type="button" className="recruiter-primary-button" onClick={() => navigate('/admin/jobs/create')}><Plus size={16} /> Post a job</button>
                            </section>
                            <section className="recruiter-profile-stats" aria-label="Hiring overview">
                                <article><span className="recruiter-stat-icon"><Building2 size={18} /></span><small>Companies</small><strong>{companies.length}</strong><Link to="/admin/companies">Manage companies <ArrowRight size={14} /></Link></article>
                                <article><span className="recruiter-stat-icon"><BriefcaseBusiness size={18} /></span><small>Open jobs</small><strong>{allAdminJobs.filter(job => job.isOpen !== false).length}</strong><Link to="/admin/jobs">Manage jobs <ArrowRight size={14} /></Link></article>
                                <article><span className="recruiter-stat-icon"><Users size={18} /></span><small>Applicants</small><strong>{allAdminJobs.reduce((total, job) => total + (job.applications?.length || 0), 0)}</strong><Link to="/admin/applicants">Review applicants <ArrowRight size={14} /></Link></article>
                            </section>
                            <section className="profile-dashboard-section recruiter-companies-section">
                                <header className="profile-dashboard-section-header"><div><h2>Your companies</h2><p>Company details applicants see on your job listings.</p></div><button type="button" className="recruiter-secondary-button" onClick={() => navigate('/admin/companies')}>Manage companies</button></header>
                                {companies.length ? <div className="recruiter-profile-company-list">{companies.map(company => <article className="recruiter-profile-company" key={company._id}>
                                    <div className="recruiter-company-mark">{company.logo ? <img src={company.logo} alt="" /> : <Building2 size={20} />}</div>
                                    <div className="recruiter-company-details"><h3>{company.name}</h3><p>{company.location || 'Add a location'}{company.website ? ` · ${company.website}` : ''}</p>{company.description && <small>{company.description}</small>}</div>
                                    <button type="button" className="profile-section-edit" onClick={() => navigate(`/admin/companies/${company._id}`)} aria-label={`Edit ${company.name}`}><Pen size={15} /></button>
                                </article>)}</div> : <button type="button" className="profile-dashboard-add-card" onClick={() => navigate('/admin/companies/create')}><span><Plus size={18} /></span><span><strong>Add your company</strong><small>Create your company profile before posting jobs.</small></span><ArrowRight size={17} /></button>}
                            </section>
                            <section className="profile-dashboard-section recruiter-recent-jobs">
                                <header className="profile-dashboard-section-header"><div><h2>Recent jobs</h2><p>See how your openings are performing.</p></div><Link to="/admin/jobs" className="profile-dashboard-section-link">All jobs <ArrowRight size={15} /></Link></header>
                                {allAdminJobs.length ? <div className="recruiter-profile-job-list">{allAdminJobs.slice(0, 5).map(job => <article key={job._id}>
                                    <div><h3>{job.title}</h3><p>{job.company?.name || 'Company'}</p></div>
                                    <span className={`recruiter-job-state${job.isOpen === false ? ' is-closed' : ''}`}>{job.isOpen === false ? 'Closed' : 'Open'}</span>
                                    <span className="recruiter-job-applicant-count">{job.applications?.length || 0} applicants</span>
                                    <button type="button" className="applicant-view-button" onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)}>View applicants</button>
                                </article>)}</div> : <div className="applicants-empty"><BriefcaseBusiness size={24} /><strong>No jobs posted yet</strong><span>Create a job to start receiving applications.</span><button type="button" className="recruiter-primary-button" onClick={() => navigate('/admin/jobs/create')}><Plus size={15} /> Post a job</button></div>}
                            </section>
                        </> : <>
                        <section className="profile-dashboard-section">
                            <header className="profile-dashboard-section-header">
                                <div><h2>Skills</h2><p>Skills you’ve added to your profile</p></div>
                                <button type="button" onClick={() => setSkillsOpen(true)} className="profile-section-edit" aria-label="Edit skills"><Pen size={15} /></button>
                            </header>
                            {skills.length ? <div className="profile-dashboard-skill-list">{skills.map((skill, index) => <Badge className="profile-skill-chip" key={`${skill}-${index}`}>{skill}</Badge>)}</div> : <p className="profile-dashboard-empty">Add your skills to help recruiters find your profile.</p>}
                        </section>

                        {verifiedSkills.length > 0 && <section className="profile-dashboard-section">
                            <header className="profile-dashboard-section-header"><div><h2>Verified skills</h2><p>Skills demonstrated through Career Coach quizzes</p></div></header>
                            <div className="profile-dashboard-skill-list">{verifiedSkills.map(item => <span className="profile-verified-skill" key={item.skill}><CheckCircle2 size={16} />{item.skill}<small>{item.score}%</small></span>)}</div>
                        </section>}

                        <section className="profile-dashboard-section">
                            <header className="profile-dashboard-section-header"><div><h2>Achievements</h2><p>Awards and accomplishments</p></div><button type="button" onClick={() => setActiveEditor('achievements')} className="profile-section-edit" aria-label="Edit achievements"><Pen size={15} /></button></header>
                            {achievements.length ? <div className="profile-achievement-list">{achievements.map((item, index) => <article className="profile-achievement-card" key={item._id || `${item.title}-${index}`}><div className="profile-achievement-icon"><Sparkles size={18} /></div><div><h3>{item.title}</h3>{item.organization && <p>{item.organization}</p>}{item.date && <small>{item.date}</small>}{item.description && <p>{item.description}</p>}</div>{item.link && <a href={item.link} target="_blank" rel="noreferrer" aria-label={`View ${item.title}`}><ExternalLink size={16} /></a>}</article>)}</div> : <button type="button" className="profile-dashboard-add-card" onClick={() => setActiveEditor('achievements')}><span><Plus size={18} /></span><span><strong>Add achievement</strong><small>Show awards and accomplishments on your profile.</small></span><ArrowRight size={17} /></button>}
                        </section>

                        <section className="profile-dashboard-section">
                            <header className="profile-dashboard-section-header"><div><h2>Certificates</h2><p>Professional credentials and courses</p></div><button type="button" onClick={() => setActiveEditor('certificates')} className="profile-section-edit" aria-label="Edit certificates"><Pen size={15} /></button></header>
                            {certificates.length ? <div className="profile-achievement-list">{certificates.map((item, index) => <article className="profile-achievement-card" key={item._id || `${item.title}-${index}`}><div className="profile-achievement-icon"><FileCheck2 size={18} /></div><div><h3>{item.title}</h3>{item.organization && <p>{item.organization}</p>}{item.date && <small>{item.date}</small>}{item.description && <p>{item.description}</p>}</div>{item.link && <a href={item.link} target="_blank" rel="noreferrer" aria-label={`View ${item.title}`}><ExternalLink size={16} /></a>}</article>)}</div> : <button type="button" className="profile-dashboard-add-card" onClick={() => setActiveEditor('certificates')}><span><Plus size={18} /></span><span><strong>Add a certificate</strong><small>List certifications and credentials you have earned.</small></span><ArrowRight size={17} /></button>}
                        </section>

                        <section className="profile-dashboard-section">
                            <header className="profile-dashboard-section-header">
                                <div><h2>Projects</h2><p>Work that shows your experience in practice</p></div>
                                <button type="button" onClick={() => setActiveEditor('projects')} className="profile-section-edit" aria-label="Edit projects"><Pen size={15} /></button>
                            </header>
                            {projects.length ? <div className="profile-project-list">{projects.map((project, index) => <article className="profile-project-card" key={project._id || `${project.title}-${index}`}>
                                <div className="profile-project-icon"><BriefcaseBusiness size={18} /></div>
                                <div><h3>{project.title}</h3>{project.description && <p>{project.description}</p>}{project.skills?.length > 0 && <div className="profile-dashboard-skill-list">{project.skills.map(skill => <Badge className="profile-skill-chip" key={skill}>{skill}</Badge>)}</div>}</div>
                                {project.link && <a href={project.link} target="_blank" rel="noreferrer" aria-label={`Open ${project.title}`}><ExternalLink size={16} /></a>}
                            </article>)}</div> : <button type="button" className="profile-dashboard-add-card" onClick={() => setActiveEditor('projects')}><span><Plus size={18} /></span><span><strong>Add a project</strong><small>Show recruiters what you’ve built and which skills you used.</small></span><ArrowRight size={17} /></button>}
                        </section>

                        <section className="profile-dashboard-section">
                            <header className="profile-dashboard-section-header"><div><h2>Experience</h2><p>Employment, internships, and work experience</p></div><button type="button" onClick={() => setActiveEditor('experience')} className="profile-section-edit" aria-label="Edit experience"><Pen size={15} /></button></header>
                            {experience.length ? <div className="profile-timeline-list">{experience.map((item, index) => <article className="profile-timeline-card" key={item._id || `${item.title}-${index}`}><span className="profile-timeline-mark" /><div><h3>{item.title}</h3>{item.company && <p className="profile-timeline-subtitle">{item.company}{item.location ? ` · ${item.location}` : ''}</p>}<small>{[item.startDate, item.current ? 'Present' : item.endDate].filter(Boolean).join(' — ')}{item.employmentType ? ` · ${item.employmentType}` : ''}</small>{item.description && <p>{item.description}</p>}</div></article>)}</div> : <button type="button" className="profile-dashboard-add-card" onClick={() => setActiveEditor('experience')}><span><Plus size={18} /></span><span><strong>Add experience</strong><small>Add internships, jobs, or other relevant roles.</small></span><ArrowRight size={17} /></button>}
                        </section>

                        <section className="profile-dashboard-section">
                            <header className="profile-dashboard-section-header"><div><h2>Education</h2><p>Schools, degrees, and qualifications</p></div><button type="button" onClick={() => setActiveEditor('education')} className="profile-section-edit" aria-label="Edit education"><Pen size={15} /></button></header>
                            {education.length ? <div className="profile-timeline-list">{education.map((item, index) => <article className="profile-timeline-card" key={item._id || `${item.institution}-${index}`}><span className="profile-timeline-mark education" /><div><h3>{item.institution}</h3><p className="profile-timeline-subtitle">{[item.degree, item.fieldOfStudy].filter(Boolean).join(' · ')}</p>{item.location && <p className="profile-timeline-subtitle">{item.location}</p>}<small>{[item.startDate, item.current ? 'Present' : item.endDate].filter(Boolean).join(' — ')}</small>{item.description && <p>{item.description}</p>}</div></article>)}</div> : <button type="button" className="profile-dashboard-add-card" onClick={() => setActiveEditor('education')}><span><Plus size={18} /></span><span><strong>Add education</strong><small>Add your school, degree, and expected graduation.</small></span><ArrowRight size={17} /></button>}
                        </section>
                        </>}
                    </div>
                </div>
            </main>
            <UpdateProfileDialog open={open} setOpen={setOpen} />
            {!isRecruiter && <>
                <EditSkillsDialog open={skillsOpen} setOpen={setSkillsOpen} />
                <UpdateResumeDialog open={resumeOpen} setOpen={setResumeOpen} />
                {PROFILE_RECORD_SECTIONS.map(config => <ProfileRecordsDialog key={config.section} open={activeEditor === config.section} setOpen={isOpen => setActiveEditor(isOpen ? config.section : null)} section={config.section} title={config.title} description={config.description} records={user?.profile?.[config.section] || []} fields={config.fields} />)}
            </>}
        </div>
        </OpportunityLayout>
    )
}

export default Profile
