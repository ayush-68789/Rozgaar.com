import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BriefcaseBusiness, MapPin } from 'lucide-react'
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

    return (
        <footer className="site-footer directory-footer">
            {user?.role !== 'recruiter' && <div className="footer-directory">
                <section className="footer-directory-section">
                    <h3><BriefcaseBusiness size={17} /> Browse jobs by category</h3>
                    <div className="footer-directory-links">{jobCategories.map(([label, query]) => jobLink(label, query))}<Link className="footer-view-all" to="/jobs" onClick={() => setSearchedQuery('')}>View all jobs <ArrowRight size={14} /></Link></div>
                </section>
                <section className="footer-directory-section">
                    <h3><MapPin size={17} /> Browse jobs by location</h3>
                    <div className="footer-directory-links">{jobLocations.map((location) => jobLink(location, location))}<Link className="footer-view-all" to="/jobs" onClick={() => setSearchedQuery('')}>View all locations <ArrowRight size={14} /></Link></div>
                </section>
            </div>}
            <div className="footer-dark">
                <div className="footer-main">
                    <div className="footer-brand"><Link to="/" className="brand-lockup"><span className="brand-mark"><BriefcaseBusiness size={21}/></span><span>Rozgaar<span>.com</span><small>Find your next chapter</small></span></Link><p>Explore open roles and find the next step in your career.</p><Link className="footer-contact-cta" to="/contact">Get in touch <ArrowRight size={15} /></Link></div>
                    <div className="footer-column"><strong>For candidates</strong><Link to="/jobs">Find jobs</Link><Link to="/browse">Browse opportunities</Link><Link to="/profile">My profile</Link></div>
                    {user?.role !== 'student' && <div className="footer-column"><strong>For employers</strong><Link to="/employer/login">Employer log in</Link><Link to="/employer/register">Create employer account</Link><Link to="/employer/login">Post a job</Link></div>}
                    <div className="footer-column"><strong>Rozgaar.com</strong><Link to="/about">About us</Link><Link to="/contact">Contact</Link></div>
                    <div className="footer-column"><strong>Your account</strong><Link to="/login">Login</Link><Link to="/signup">Create account</Link></div>
                </div>
                <div className="footer-bottom"><span>© {new Date().getFullYear()} Rozgaar.com. All rights reserved.</span><Link to="/jobs">Find your next opportunity <ArrowRight size={13} /></Link></div>
            </div>
        </footer>
    )
}

export default Footer
