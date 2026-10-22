import React, { useEffect } from 'react'
import Navbar from '../components/shared/Navbar'
import HeroSection from '../components/HeroSection'
import CategoryCarousel from '../components/CategoryCarousel'
import LatestJobs from '../components/LatestJobs'
import HomeDirectory from '../components/HomeDirectory'
import Footer from '../components/shared/Footer'
import useGetAllJobs from '@/hooks/useGetAllJobs'
import { useApp } from '@/context/AppContext'
import { useNavigate } from 'react-router-dom'

const Home = () => {
    useGetAllJobs();
    const { user, setSearchedQuery, setJobFilters } = useApp();
    const navigate = useNavigate();

    useEffect(() => {
        setSearchedQuery('');
        setJobFilters({ location: '', industry: '', salary: '', experience: '' });
    }, [setSearchedQuery, setJobFilters]);

    useEffect(() => {
        if (user?.role === 'recruiter') {
            navigate("/admin/companies");
        }
    }, [user, navigate]);

    return (
        <div className="job-portal-home">
            <Navbar />
            <HeroSection />
            <CategoryCarousel />
            <HomeDirectory />
            <LatestJobs />
            <Footer />
        </div>
    )
}

export default Home
