import { NavLink } from 'react-router-dom'
import Navbar from '../shared/Navbar'
import Footer from '../shared/Footer'
import '@/styles/coach.css'

const tabs = [
    ['/coach', 'Dashboard', true],
    ['/coach/resume', 'Resume analyzer'],
    ['/coach/news', 'Tech news'],
]

const CoachShell = ({ title, subtitle, actions, children }) => (
    <div className="coach-page">
        <Navbar />
        <main className="coach-main">
            <nav className="coach-tabs" aria-label="Career coach sections">
                {tabs.map(([to, label, end]) => (
                    <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>
                ))}
            </nav>
            <div className="coach-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>{title}</h1>
                    {subtitle && <p className="coach-sub">{subtitle}</p>}
                </div>
                {actions}
            </div>
            {children}
        </main>
        <Footer />
    </div>
)

export default CoachShell
