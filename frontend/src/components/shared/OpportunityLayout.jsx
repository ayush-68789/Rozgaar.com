import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BriefcaseBusiness, Building2, ChevronLeft, CircleHelp, FileCheck2, FileText, Home as HomeIcon, Mail, Plus, Search, Sparkles, UserRound, Users } from 'lucide-react'
import NotificationBell from './NotificationBell'
import Footer from './Footer'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useApp } from '@/context/AppContext'

const sideLinks = [
    { label: 'Home', icon: HomeIcon, to: '/' },
    { label: 'Jobs', icon: BriefcaseBusiness, to: '/jobs' },
    { label: 'Companies', icon: Building2, to: '/companies' },
    { label: 'My Applications', icon: FileText, to: '/applications' },
    { label: 'Contact Us', icon: Mail, to: '/contact' },
    { label: 'Resume ATS Checker', icon: FileCheck2, to: '/resume-checker' },
    { label: 'Career Coach', icon: Sparkles, to: '/coach' },
]

const recruiterSideLinks = [
    { label: 'My Company', icon: Building2, to: '/admin/companies' },
    { label: 'My Jobs', icon: BriefcaseBusiness, to: '/admin/jobs' },
    { label: 'Applicants', icon: Users, to: '/admin/applicants' },
    { label: 'Post a Job', icon: Plus, to: '/admin/jobs/create' },
]

const OpportunityLayout = ({ activePage, breadcrumb, searchPlaceholder = 'Search...', showFooter = false, recruiterMode = false, children }) => {
    const { user, searchedQuery, setSearchedQuery, setJobFilters } = useApp()
    const navigate = useNavigate()
    const [searchText, setSearchText] = useState(searchedQuery || '')
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const isRecruiterView = recruiterMode || user?.role === 'recruiter'
    const navigationLinks = isRecruiterView
        ? recruiterSideLinks
        : sideLinks.filter(item => user?.role === 'student' || item.label !== 'Career Coach')

    useEffect(() => setSearchText(searchedQuery || ''), [searchedQuery])

    const submitSearch = event => {
        event.preventDefault()
        setSearchedQuery(searchText.trim())
        setJobFilters({ location: '', industry: '', salary: '', experience: '', type: '' })
        navigate('/jobs')
    }

    return (
        <div className={`unstop-home-shell${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
            <aside className="unstop-home-sidebar">
                <div className="unstop-home-brand-row">
                    <Link to="/" className="unstop-home-brand"><span>R</span>ozgaar.com</Link>
                    <button type="button" className="unstop-sidebar-collapse" onClick={() => setSidebarCollapsed(collapsed => !collapsed)} aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'} title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}><ChevronLeft size={17} /></button>
                </div>
                <div className="unstop-viewing-card">
                    <span>You’re viewing as</span>
                    <div><span className="unstop-talent-dot"><UserRound size={16} /></span><strong>{isRecruiterView ? 'Recruiter' : 'Candidate'}</strong></div>
                </div>
                <nav className="unstop-side-nav" aria-label="Main navigation">
                    {navigationLinks.map(({ label, icon: Icon, to }) => <Link to={to} className={`unstop-side-link${activePage === label ? ' active' : ''}`} key={label}><Icon size={19} /><span>{label}</span></Link>)}
                </nav>
                {user && <Link to="/profile" className="unstop-activity-link"><UserRound size={18} /><span>My Profile</span></Link>}
            </aside>

            <div className={`unstop-home-workspace${activePage === 'My Applications' ? ' is-applications-workspace' : ''}`}>
                <header className={`unstop-topbar${breadcrumb ? ' has-breadcrumb' : ''}`}>
                    {breadcrumb && <div className="unstop-breadcrumb"><Link to="/" aria-label="Home"><HomeIcon size={15} /></Link><span>/</span><span>{breadcrumb}</span></div>}
                    <form className="unstop-top-search" onSubmit={submitSearch}>
                        <Search size={19} />
                        <input value={searchText} onChange={event => setSearchText(event.target.value)} placeholder={searchPlaceholder} aria-label="Search jobs" />
                    </form>
                    <div className="unstop-top-actions">
                        <Link to="/about" className="unstop-help-link" aria-label="Help and about"><CircleHelp size={19} /></Link>
                        {!recruiterMode && user?.role !== 'student' && <Link to={user?.role === 'recruiter' ? '/admin/companies' : '/employer/login'} className="unstop-business-link"><Building2 size={17} />For Recruiters</Link>}
                        {user ? <>
                            <NotificationBell />
                            <Link to={user.role === 'recruiter' ? '/admin/applicants' : '/applications'} className="unstop-icon-link" aria-label={user.role === 'recruiter' ? 'Applicants' : 'My applications'} title={user.role === 'recruiter' ? 'Applicants' : 'My applications'}><FileText size={19} /></Link>
                            <Link to="/profile" className="unstop-profile-link"><Avatar><AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname || 'Profile'} /><AvatarFallback>{user?.fullname?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback></Avatar><span>My Profile</span></Link>
                        </> : <div className="unstop-guest-actions"><Link to="/login">Log in</Link><Link to="/signup">Sign up</Link></div>}
                    </div>
                </header>
                {children}
                {showFooter && <Footer />}
            </div>
        </div>
    )
}

export default OpportunityLayout
