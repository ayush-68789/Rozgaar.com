import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useLocation, useNavigate } from "react-router-dom";
import OpportunityLayout from "@/components/shared/OpportunityLayout";

const ProtectedRoute = ({children}) => {
    const { user, isAuthChecking } = useApp();

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(()=>{
        if(!isAuthChecking && (user === null || user.role !== 'recruiter')){
            navigate(user === null ? "/employer/login" : "/");
        }
    },[user, isAuthChecking, navigate]);

    if (isAuthChecking || user === null || user.role !== 'recruiter') {
        return null;
    }

    const pathname = location.pathname;
    const activePage = pathname === '/admin/applicants' || pathname.includes('/applicants')
        ? 'Applicants'
        : pathname.includes('/companies')
        ? 'My Company'
        : pathname.endsWith('/create') || pathname.endsWith('/edit')
            ? 'Post a Job'
            : 'My Jobs';
    const breadcrumb = activePage === 'Applicants' ? 'Applicants' : activePage === 'My Company' ? 'My Company' : activePage === 'Post a Job' ? 'Post a Job' : 'My Jobs';

    return <OpportunityLayout activePage={activePage} breadcrumb={breadcrumb}>{children}</OpportunityLayout>;
};
export default ProtectedRoute;
