import React, { useEffect, useState } from 'react'
import Navbar from '../shared/Navbar'
import Footer from '../shared/Footer'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { toast } from 'react-toastify'
import { useApp } from '@/context/AppContext'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'

const Signup = ({ recruiterOnly = false }) => {
    const [input, setInput] = useState({
        fullname: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: recruiterOnly ? 'recruiter' : 'student',
        file: '',
        resume: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const { loading, user, setLoading, setUser } = useApp();
    const navigate = useNavigate();

    const changeEventHandler = (event) => {
        setInput(current => ({ ...current, [event.target.name]: event.target.value }));
    };

    const changeFileHandler = (event) => {
        setInput(current => ({ ...current, file: event.target.files?.[0] || '' }));
    };

    const changeResumeHandler = (event) => {
        const resume = event.target.files?.[0];
        if (resume && resume.size > 5 * 1024 * 1024) {
            toast.error('Choose a resume under 5 MB.');
            event.target.value = '';
            return;
        }
        setInput(current => ({ ...current, resume: resume || '' }));
    };

    const submitHandler = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('fullname', input.fullname);
        formData.append('email', input.email);
        formData.append('phoneNumber', input.phoneNumber);
        formData.append('password', input.password);
        formData.append('role', input.role);
        if (input.file) formData.append('file', input.file);
        if (input.role === 'student' && input.resume) formData.append('resume', input.resume);

        try {
            setLoading(true);
            const response = await axios.post(`${USER_API_END_POINT}/register`, formData, {
                withCredentials: true
            });
            if (response.data.success) {
                setUser(response.data.user);
                toast.success(response.data.message);
                navigate(response.data.user.role === 'recruiter' ? '/admin/companies' : '/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) navigate(user.role === 'recruiter' ? '/admin/companies' : '/');
    }, [user, navigate]);

    return (
        <div className="app-page auth-page">
            <Navbar />
            <main className="auth-layout signup-layout">
                <div className="signup-content">
                        <div className="signup-page-heading"><h1>{recruiterOnly ? 'Create an employer account' : 'Create account'}</h1><p>{recruiterOnly ? 'Start building your team on Rozgaar.com.' : 'Join Rozgaar.com and get started.'}</p></div>
                        <form onSubmit={submitHandler} className="auth-card signup-card">
                            <div className="signup-card-heading"><strong>{recruiterOnly ? 'Recruiter account' : 'Candidate account'}</strong><span>{recruiterOnly ? 'Create an account to start sharing job openings.' : 'Use your details so employers can get in touch.'}</span></div>
                            <div className="signup-fields">
                                <div className="my-2 signup-field-wide"><Label htmlFor="signup-name">Full name</Label><Input id="signup-name" type="text" value={input.fullname} name="fullname" onChange={changeEventHandler} placeholder="Your full name" autoComplete="name" required /></div>
                                <div className="my-2 signup-field-wide"><Label htmlFor="signup-email">Email address</Label><Input id="signup-email" type="email" value={input.email} name="email" onChange={changeEventHandler} placeholder="you@example.com" autoComplete="email" required /></div>
                                <div className="my-2 signup-field-wide">
                                    <div className="auth-label-row"><Label htmlFor="signup-password">Password</Label><span>At least 8 characters</span></div>
                                    <div className="password-field-wrap"><Input id="signup-password" type={showPassword ? 'text' : 'password'} value={input.password} name="password" onChange={changeEventHandler} placeholder="Create a password" autoComplete="new-password" minLength={8} required /><button type="button" className="password-visibility-button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
                                </div>
                                <div className="my-2"><Label htmlFor="signup-phone">Phone number</Label><Input id="signup-phone" type="tel" value={input.phoneNumber} name="phoneNumber" onChange={changeEventHandler} placeholder="Your phone number" autoComplete="tel" required /></div>
                                <div className="my-2 signup-photo-field"><Label htmlFor="profile-photo">Profile photo <span>(optional)</span></Label><Input id="profile-photo" accept="image/*" type="file" onChange={changeFileHandler} /></div>
                                {input.role === 'student' && <div className="my-2 signup-photo-field signup-field-wide"><Label htmlFor="candidate-resume">Resume <span>(PDF, DOC or DOCX · up to 5 MB · optional)</span></Label><Input id="candidate-resume" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" type="file" onChange={changeResumeHandler} />{input.resume && <small className="resume-selected-name">Selected: {input.resume.name}</small>}</div>}
                            </div>
                            <Button type="submit" disabled={loading} className="auth-submit-button w-full my-4">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</> : <>Create account <ArrowRight size={16} /></>}</Button>
                            <span className="text-sm">{recruiterOnly ? 'Already hiring with us?' : 'Already registered?'} <Link to={recruiterOnly ? '/employer/login' : '/login'}>Log in</Link></span>
                        </form>
                    </div>
            </main>
            <Footer />
        </div>
    );
};

export default Signup;


