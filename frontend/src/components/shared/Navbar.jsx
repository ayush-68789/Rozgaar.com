import React from 'react'
import { Button } from '../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { BriefcaseBusiness, ChevronDown } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import NotificationBell from './NotificationBell'

const Navbar = () => {
    const { user } = useApp();
    return (
        <header className={`site-header${user?.role === 'recruiter' ? ' recruiter-header' : ''}`}>
            <div className='nav-shell'>
            <div className='nav-inner'>
                <Link to='/' className='brand-lockup'><span className='brand-mark'><BriefcaseBusiness size={21}/></span><span>Rozgaar<span>.com</span></span></Link>
                <div className='nav-content'>
                    <ul className='nav-links'>
                        {
                            user && user.role === 'recruiter' ? (
                                <>
                                    <li><NavLink to="/admin/companies" className={({ isActive }) => isActive ? 'nav-active' : ''}>Companies</NavLink></li>
                                    <li><NavLink to="/admin/jobs" className={({ isActive }) => isActive ? 'nav-active' : ''}>Jobs</NavLink></li>
                                    <li><NavLink to="/about" className={({ isActive }) => isActive ? 'nav-active' : ''}>About Us</NavLink></li>
                                    <li><NavLink to="/contact" className={({ isActive }) => isActive ? 'nav-active' : ''}>Contact</NavLink></li>
                                </>
                            ) : (
                                <>
                                    <li><NavLink to="/jobs" className={({ isActive }) => isActive ? 'nav-active' : ''}>Jobs</NavLink></li>
                                    <li><NavLink to="/companies" className={({ isActive }) => isActive ? 'nav-active' : ''}>Companies</NavLink></li>
                                    {user?.role === 'student' && <li><NavLink to="/coach" className={({ isActive }) => isActive ? 'nav-active' : ''}>Career Coach</NavLink></li>}
                                    <li><NavLink to="/about" className={({ isActive }) => isActive ? 'nav-active' : ''}>About Us</NavLink></li>
                                    <li><NavLink to="/contact" className={({ isActive }) => isActive ? 'nav-active' : ''}>Contact</NavLink></li>
                                </>
                            )
                        }


                    </ul>
                    {
                        !user ? (
                            <div className='nav-account-actions'>
                                <Link to="/login" className="login-link">Login</Link>
                                <Link to="/signup"><Button className="button-teal nav-cta">Register</Button></Link>
                                <details className="employer-dropdown">
                                    <summary className="employer-nav-link">For employers <ChevronDown size={13} /></summary>
                                    <div className="employer-dropdown-menu">
                                        <Link to="/employer/login">Login as employer</Link>
                                        <Link to="/employer/register">Register as employer</Link>
                                    </div>
                                </details>
                            </div>
                        ) : (
            <>
            <NotificationBell />
            <Link to="/profile" className="nav-profile-link" aria-label="My Profile">
                <Avatar className="account-menu-avatar">
                    <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname || 'Profile'} />
                    <AvatarFallback className="bg-gray-200 text-gray-600 font-semibold">{user?.fullname?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>My Profile</span>
            </Link>
                            </>
                        )
                    }
                </div>
            </div></div>
        </header>
    )
}

export default Navbar
