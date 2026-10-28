import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BriefcaseBusiness, Building2, FileCheck2, FileText, Newspaper, Sparkles } from 'lucide-react'

const categories = [
    { name: 'Jobs', to: '/jobs', icon: BriefcaseBusiness },
    { name: 'Companies', to: '/companies', icon: Building2 },
    { name: 'My Applications', to: '/applications', icon: FileText },
    { name: 'Resume ATS Checker', to: '/resume-checker', icon: FileCheck2 },
    { name: 'Career Coach', to: '/coach', icon: Sparkles },
    { name: 'Tech News', to: '/coach/news', icon: Newspaper },
]

const CategoryCarousel = () => {
    const navigate = useNavigate()

    return <section className="home-category-section unstop-category-section" aria-label="Career categories">
        <div className="unstop-category-track">{categories.map(({ name, to, icon: Icon }, index) => <button className={`unstop-category-tile color-${index % 7}`} key={name} type="button" onClick={() => navigate(to)}>
            <strong>{name}</strong><span><Icon size={37} strokeWidth={1.8} /></span>
        </button>)}</div>
    </section>
}

export default CategoryCarousel
