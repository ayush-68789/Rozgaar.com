import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { USER_API_END_POINT } from '@/utils/constant';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [loading, setLoading] = useState(false);
    const [allJobs, setAllJobs] = useState([]);
    const [singleJob, setSingleJob] = useState(null);
    const [allAdminJobs, setAllAdminJobs] = useState([]);
    const [searchJobByText, setSearchJobByText] = useState("");
    const [allAppliedJobs, setAllAppliedJobs] = useState([]);
    const [applicants, setAllApplicants] = useState(null);
    const [searchedQuery, setSearchedQuery] = useState("");
    const [jobFilters, setJobFilters] = useState({ location: "", industry: "", salary: "", experience: "" });
    const [companies, setCompanies] = useState([]);
    const [singleCompany, setSingleCompany] = useState(null);
    const [searchCompanyByText, setSearchCompanyByText] = useState("");

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const response = await axios.get(`${USER_API_END_POINT}/me`, { withCredentials: true });
                if (response.data.success) setUser(response.data.user);
            } catch {
                setUser(null);
            } finally {
                setIsAuthChecking(false);
            }
        };
        restoreSession();
    }, []);

    return (
        <AppContext.Provider value={{
            user, setUser,
            isAuthChecking,
            loading, setLoading,
            allJobs, setAllJobs,
            singleJob, setSingleJob,
            allAdminJobs, setAllAdminJobs,
            searchJobByText, setSearchJobByText,
            allAppliedJobs, setAllAppliedJobs,
            applicants, setAllApplicants,
            searchedQuery, setSearchedQuery,
            jobFilters, setJobFilters,
            companies, setCompanies,
            singleCompany, setSingleCompany,
            searchCompanyByText, setSearchCompanyByText
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
