import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { ArrowRight, BarChart3, PieChart, Settings2, UsersRound, Home, Building2, Sparkles, GraduationCap, BriefcaseBusiness, Rocket, Database } from 'lucide-react'

const categories = [
    { name: 'Remote', query: 'Remote', icon: Home },
    { name: 'MNC', query: 'MNC', icon: Building2 },
    { name: 'Fresher', query: 'Fresher', icon: GraduationCap },
    { name: 'Project Manager', query: 'Project Manager', icon: Sparkles },
    { name: 'Supply Chain', query: 'Supply Chain', icon: BriefcaseBusiness },
    { name: 'Marketing', query: 'Marketing', icon: BarChart3 },
    { name: 'Engineering', query: 'Engineering', icon: Settings2 },
    { name: 'Analytics', query: 'Analytics', icon: PieChart },
    { name: 'Startup', query: 'Startup', icon: Rocket },
    { name: 'Data Science', query: 'Data Science', icon: Database },
    { name: 'Internship', query: 'Internship', icon: UsersRound },
]

const CategoryCarousel = () => {
    const { setSearchedQuery, setJobFilters } = useApp();
    const navigate = useNavigate();
    const searchJobHandler = (query) => { setSearchedQuery(query); setJobFilters({ location: '', industry: '', salary: '', experience: '' }); navigate('/jobs'); }

    return <section className="home-category-section">
        <div className="home-category-inner">
            <div className="category-heading"><h2>Explore jobs by category</h2></div>
            <div className="category-pill-list">{categories.map(({ name, query, icon: Icon }) => <button className="category-pill" key={name} onClick={() => searchJobHandler(query)}><Icon size={16} />{name}<ArrowRight size={13} /></button>)}</div>
        </div>
    </section>
}

export default CategoryCarousel
