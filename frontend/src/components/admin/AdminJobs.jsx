import React, { useEffect, useState } from 'react'
import Navbar from '../shared/Navbar'
import Footer from '../shared/Footer'
import { Input } from '../ui/input'
import { Button } from '../ui/button' 
import { useNavigate } from 'react-router-dom' 
import { useApp } from '@/context/AppContext' 
import AdminJobsTable from './AdminJobsTable'
import useGetAllAdminJobs from '@/hooks/useGetAllAdminJobs'
import { BriefcaseBusiness, Plus, Search } from 'lucide-react'

const AdminJobs = () => {
  useGetAllAdminJobs();
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const { setSearchJobByText } = useApp();

  useEffect(() => {
    setSearchJobByText(input);
  }, [input]);
  return (
    <div className="app-page admin-page">
      <Navbar />
      <div className='admin-content recruiter-list-content'>
        <div className="admin-page-toolbar">
          <div className="admin-page-title"><span className="admin-page-icon"><BriefcaseBusiness size={19} /></span><div><h1>Manage jobs</h1><p>Keep track of your openings and review applicants.</p></div></div>
          <div className="admin-toolbar-actions"><label className="admin-search-field"><Search size={17} /><Input aria-label="Search jobs" placeholder="Search by title or company" value={input} onChange={(e) => setInput(e.target.value)} /></label><Button className="recruiter-primary-button" onClick={() => navigate("/admin/jobs/create")}><Plus size={16} /> Post a job</Button></div>
        </div>
        <AdminJobsTable />
      </div>
      <Footer />
    </div>
  )
}

export default AdminJobs
