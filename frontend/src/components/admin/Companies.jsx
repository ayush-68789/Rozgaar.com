import React, { useEffect, useState } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import CompaniesTable from './CompaniesTable'
import { useNavigate } from 'react-router-dom'
import useGetAllCompanies from '@/hooks/useGetAllCompanies'
import { useApp } from '@/context/AppContext'
import { Building2, Plus, Search } from 'lucide-react'

const Companies = () => {
    useGetAllCompanies();
    const [input, setInput] = useState("");
    const navigate = useNavigate();
    const { companies, setSearchCompanyByText } = useApp();

    useEffect(()=>{
        setSearchCompanyByText(input);
    },[input]);
    return (
        <div className="app-page admin-page">
            <div className='admin-content recruiter-list-content companies-directory-content'>
                <div className="admin-page-toolbar companies-directory-toolbar">
                    <div className="admin-page-title"><span className="admin-page-icon"><Building2 size={19} /></span><div><h1>Your companies</h1><p>Manage the companies and teams you hire for.</p></div></div>
                    <div className="admin-toolbar-actions"><span className="company-count-pill">{companies.length} {companies.length === 1 ? 'company' : 'companies'}</span><label className="admin-search-field"><Search size={17} /><Input aria-label="Search companies" placeholder="Search companies" value={input} onChange={(e) => setInput(e.target.value)} /></label><Button className="recruiter-primary-button" onClick={() => navigate("/admin/companies/create")}><Plus size={16} /> Add company</Button></div>
                </div>
                <CompaniesTable/>
            </div>
        </div>
    )
}

export default Companies
