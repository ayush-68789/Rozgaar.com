import { useEffect, useState } from 'react'
import Navbar from '../shared/Navbar'
import Footer from '../shared/Footer'
import ApplicantsTable from './ApplicantsTable'
import axios from 'axios';
import { APPLICATION_API_END_POINT } from '@/utils/constant';
import { useParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { toast } from 'react-toastify';

const Applicants = () => {
    const params = useParams();
    const { applicants, setAllApplicants } = useApp();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setAllApplicants(null);
        setLoading(true);
        const fetchAllApplicants = async () => {
            try {
                const res = await axios.get(`${APPLICATION_API_END_POINT}/${params.id}/applicants`, { withCredentials: true });
                if (res.data.success) setAllApplicants(res.data.job);
            } catch (error) {
                console.log(error);
                toast.error(error.response?.data?.message || "Failed to load applicants.");
            } finally {
                setLoading(false);
            }
        }
        fetchAllApplicants();
    }, [params.id, setAllApplicants]);
    return (
        <div className="app-page admin-page">
            <Navbar />
            <div className='admin-content applicants-content'>
                <div className="applicants-heading">
                    <div>
                        <h1>Applicants</h1>
                        <p>{applicants?.title ? `Review candidates for ${applicants.title}.` : 'Review and manage candidates for this job.'}</p>
                    </div>
                    <div className="applicants-count"><strong>{applicants?.applications?.length || 0}</strong><span>{applicants?.applications?.length === 1 ? 'Applicant' : 'Applicants'}</span></div>
                </div>
                {loading ? <div className="applicants-loading" role="status">Loading applicants…</div> : <ApplicantsTable />}
            </div>
            <Footer />
        </div>
    )
}

export default Applicants
