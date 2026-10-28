import { ArrowRight, BriefcaseBusiness, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '@/context/AppContext'

const jobCategories = [
    ['Frontend Developer', 'Frontend Developer'],
    ['Backend Developer', 'Backend Developer'],
    ['Full Stack Developer', 'FullStack Developer'],
    ['Data Science', 'Data Science'],
    ['Design', 'Graphic Designer'],
    ['DevOps', 'DevOps Engineer'],
    ['Sales', 'Sales'],
]

const jobLocations = ['Delhi NCR', 'Bangalore', 'Hyderabad', 'Pune', 'Mumbai', 'Remote']

const Footer = () => {
    const { user, setSearchedQuery } = useApp()
    const jobLink = (label, query) => <Link key={label} to="/jobs" onClick={() => setSearchedQuery(query)}>{label}</Link>
    const viewAllJobs = () => <Link className="footer-view-all" to="/jobs" onClick={() => setSearchedQuery('')}>View all jobs <ArrowRight size={14} /></Link>

    return (
        <footer className="site-footer directory-footer">
            {user?.role !== 'recruiter' && <div className="footer-directory">
                <section className="footer-directory-section">
                    <h3><BriefcaseBusiness size={17} />Browse jobs by category</h3>
                    <div className="footer-directory-links">{jobCategories.map(([label, query]) => jobLink(label, query))}{viewAllJobs()}</div>
                </section>
                <section className="footer-directory-section">
                    <h3><MapPin size={17} />Browse jobs by location</h3>
                    <div className="footer-directory-links">{jobLocations.map(location => jobLink(location, location))}{viewAllJobs()}</div>
                </section>
            </div>}
            <div className="footer-dark">
                <div className="footer-main">
                    <div className="footer-brand">
                        <Link to="/" className="footer-wordmark"><span>R</span>ozgaar.com</Link>
                        <small className="footer-tagline">Find your next chapter</small>
                        <p>Explore open roles and take the next step in your career.</p>
                        <Link className="footer-contact-cta" to="/contact">Contact us <ArrowRight size={15} /></Link>
                    </div>
                    <nav className="footer-column" aria-label="Explore Rozgaar">
                        <strong>Explore</strong>
                        <Link to="/jobs">Find jobs</Link>
                        <Link to="/companies">Companies</Link>
                        <Link to="/applications">My applications</Link>
                        <Link to="/profile">My profile</Link>
                    </nav>
                    {user?.role !== 'recruiter' && <nav className="footer-column" aria-label="Career tools">
                        <strong>Career tools</strong>
                        <Link to="/resume-checker">Resume ATS Checker</Link>
                        {user?.role === 'student' && <Link to="/coach">Career Coach</Link>}
                    </nav>}
                    <nav className="footer-column" aria-label="About Rozgaar">
                        <strong>Rozgaar.com</strong>
                        <Link to="/about">About us</Link>
                        <Link to="/contact">Contact us</Link>
                    </nav>
                    {user?.role !== 'student' && <nav className="footer-column" aria-label="For employers">
                        <strong>For employers</strong>
                        <Link to="/employer/login">Employer log in</Link>
                        <Link to="/employer/register">Create employer account</Link>
                    </nav>}
                </div>
                <div className="footer-bottom"><span>© {new Date().getFullYear()} Rozgaar.com. All rights reserved.</span><Link to="/jobs">Find your next opportunity <ArrowRight size={13} /></Link></div>
            </div>
        </footer>
    )
}

export default Footer
