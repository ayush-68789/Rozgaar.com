import React from 'react'
import { ArrowRight, BriefcaseBusiness, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import Footer from '../components/shared/Footer'

const About = () => (
    <div className="job-portal-home info-page">
        <Navbar />
        <main className="info-page-main">
            <section className="info-hero">
                <h1>Helping people find work that moves them forward.</h1>
                <p>Rozgaar.com brings job seekers and employers together, making it easier to discover opportunities and take the next step in your career.</p>
                <Link className="info-primary-link" to="/jobs">Explore jobs <ArrowRight size={16} /></Link>
            </section>
            <section className="info-values" aria-label="What Rozgaar.com does">
                <article><span className="info-value-icon"><BriefcaseBusiness size={21} /></span><h2>Opportunities in one place</h2><p>Search open roles by job title, experience, and location to find opportunities that fit your goals.</p></article>
                <article><span className="info-value-icon"><Users size={21} /></span><h2>Connections that matter</h2><p>We help candidates present their skills and help employers find people ready to make an impact.</p></article>
            </section>
        </main>
        <Footer />
    </div>
)

export default About
