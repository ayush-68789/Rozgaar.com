import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { BriefcaseBusiness, Building2, ChevronDown, FileText, Home, LogOut, Plus, Sparkles, UserRound } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { toast } from 'react-toastify'
import { useApp } from '@/context/AppContext'
import NotificationBell from './NotificationBell'

const Navbar = () => {
    const { user, setUser } = useApp();
    const navigate = useNavigate();
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);

    const logoutHandler = async () => {
        try {
            const res = await axios.get(`${USER_API_END_POINT}/logout`, { withCredentials: true });
            if (res.data.success) {
                setUser(null);
                navigate("/");
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "An error occurred");
        }
    }
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
                    {user?.role === 'recruiter' && <Link to="/admin/jobs/create" className="nav-post-job"><Plus size={15} />Post a job</Link>}
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
            <Popover open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
                                <PopoverTrigger asChild>
                                    <button type="button" className="account-menu-trigger" aria-label="Open account menu" aria-expanded={accountMenuOpen}>
                                        <Avatar className="account-menu-avatar">
                                            <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname || 'Account'} />
                                            <AvatarFallback className="bg-gray-200 text-gray-600 font-semibold">{user?.fullname?.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="account-menu-user-name">{user?.fullname?.split(' ')[0]}</span>
                                        <ChevronDown size={15} className={accountMenuOpen ? 'account-chevron is-open' : 'account-chevron'} />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent align="end" sideOffset={12} className="w-80 account-menu">
                                    <div className="account-menu-identity">
                                        <Avatar className="account-menu-profile-avatar">
                                            <AvatarImage src={user?.profile?.profilePhoto} alt="" />
                                            <AvatarFallback className="bg-white text-blue-700 font-semibold">{user?.fullname?.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="account-menu-identity-copy">
                                            <div className="account-menu-name">{user?.fullname || 'Your account'}</div>
                                            <div className="account-menu-email">{user?.email}</div>
                                            <span className="account-menu-role">{user?.role === 'recruiter' ? 'Recruiter account' : 'Candidate account'}</span>
                                        </div>
                                    </div>
                                    <nav className="account-menu-links" aria-label="Account navigation">
                                        <Link to="/" onClick={() => setAccountMenuOpen(false)}><Home size={17} />Home</Link>
                                        {user?.role === 'recruiter' ? <>
                                            <Link to="/admin/companies" onClick={() => setAccountMenuOpen(false)}><Building2 size={17} />Companies</Link>
                                            <Link to="/admin/jobs" onClick={() => setAccountMenuOpen(false)}><BriefcaseBusiness size={17} />Manage jobs</Link>
                                            <Link to="/admin/jobs/create" onClick={() => setAccountMenuOpen(false)}><Plus size={17} />Post a job</Link>
                                        </> : <>
                                            <Link to="/profile" onClick={() => setAccountMenuOpen(false)}><UserRound size={17} />My Profile</Link>
                                            <Link to="/applications" onClick={() => setAccountMenuOpen(false)}><FileText size={17} />My Applications</Link>
                                            <Link to="/coach" onClick={() => setAccountMenuOpen(false)}><Sparkles size={17} />Career Coach</Link>
                                        </>}
                                    </nav>
                                    <button type="button" className="account-menu-logout" onClick={logoutHandler}><LogOut size={17} />Logout</button>
                                </PopoverContent>
                            </Popover>
                            </>
                        )
                    }
                </div>
            </div></div>
        </header>
    )
}

export default Navbar
