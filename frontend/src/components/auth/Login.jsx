import React, { useEffect, useState } from 'react'
import OpportunityLayout from '../shared/OpportunityLayout'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { toast } from 'react-toastify'
import { useApp } from '@/context/AppContext'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'

const Login = ({ recruiterOnly = false }) => {
    const [input, setInput] = useState({ email: '', password: '', role: recruiterOnly ? 'recruiter' : 'student' });
    const [showPassword, setShowPassword] = useState(false);
    const { loading, user, setLoading, setUser } = useApp();
    const navigate = useNavigate();

    const changeEventHandler = (event) => {
        setInput(current => ({ ...current, [event.target.name]: event.target.value }));
    };

    const submitHandler = async (event) => {
        event.preventDefault();
        try {
            setLoading(true);
            const response = await axios.post(`${USER_API_END_POINT}/login`, input, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });
            if (response.data.success) {
                setUser(response.data.user);
                navigate(response.data.user.role === 'recruiter' ? '/admin/companies' : '/');
                toast.success(response.data.message);
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
        <OpportunityLayout breadcrumb={recruiterOnly ? 'Employer log in' : 'Log in'} recruiterMode={recruiterOnly}>
        <div className="app-page auth-page">
            <main className="auth-layout">
                <form onSubmit={submitHandler} className="auth-card login-card">
                        {recruiterOnly && <input type="hidden" name="role" value="recruiter" />}
                        <div className="login-heading"><h1>{recruiterOnly ? 'Employer log in' : 'Welcome back'}</h1><p>{recruiterOnly ? 'Sign in to manage your company and hiring.' : 'Log in to continue to Rozgaar.com.'}</p></div>
                        <div className="my-2">
                            <Label htmlFor="login-email">Email address</Label>
                            <Input id="login-email" type="email" value={input.email} name="email" onChange={changeEventHandler} placeholder="you@example.com" autoComplete="email" required />
                        </div>
                        <div className="my-2">
                            <div className="auth-label-row"><Label htmlFor="login-password">Password</Label></div>
                            <div className="password-field-wrap">
                                <Input id="login-password" type={showPassword ? 'text' : 'password'} value={input.password} name="password" onChange={changeEventHandler} placeholder="Enter your password" autoComplete="current-password" required />
                                <button type="button" className="password-visibility-button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                            </div>
                        </div>
                        <Button type="submit" disabled={loading} className="auth-submit-button w-full my-4">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</> : <>Log in <ArrowRight size={16} /></>}</Button>
                        <span className="text-sm">{recruiterOnly ? 'Hiring with us for the first time?' : 'New to Rozgaar.com?'} <Link to={recruiterOnly ? '/employer/register' : '/signup'}>{recruiterOnly ? 'Create an employer account' : 'Create an account'}</Link></span>
                    </form>
            </main>
        </div>
        </OpportunityLayout>
    );
};

export default Login;



