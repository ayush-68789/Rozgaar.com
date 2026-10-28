import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import OpportunityLayout from '@/components/shared/OpportunityLayout'
import CategoryCarousel from '../components/CategoryCarousel'
import LatestJobs from '../components/LatestJobs'
import HomeDirectory from '../components/HomeDirectory'
import useGetAllJobs from '@/hooks/useGetAllJobs'
import { useApp } from '@/context/AppContext'

const Home = () => {
    useGetAllJobs()
    const { user, setSearchedQuery, setJobFilters } = useApp()
    const navigate = useNavigate()

    useEffect(() => {
        setSearchedQuery('')
        setJobFilters({ location: '', industry: '', salary: '', experience: '', type: '' })
    }, [setSearchedQuery, setJobFilters])

    useEffect(() => {
        if (user?.role === 'recruiter') navigate('/admin/companies')
    }, [user, navigate])

    return (
        <OpportunityLayout activePage="Home" showFooter>
            <main className="unstop-home-content">
                <section className="unstop-career-hero">
                    <div className="unstop-hero-heading"><h1>Unlock Your <span>Career!</span></h1><Link to={user?.role === 'student' ? '/coach' : '/signup'} className="unstop-access-pill"><Sparkles size={15} />Access career coaching</Link></div>
                </section>
                <CategoryCarousel />
                <LatestJobs />
                <div className="unstop-home-directory"><HomeDirectory /></div>
            </main>
        </OpportunityLayout>
    )
}

export default Home
