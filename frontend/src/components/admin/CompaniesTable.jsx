import React, { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Building2, Edit2, MapPin, MoreHorizontal, Trash2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { COMPANY_API_END_POINT } from '@/utils/constant'
import { toast } from 'react-toastify'

const CompaniesTable = () => {
    const { companies, setCompanies, searchCompanyByText } = useApp();
    const [filterCompany, setFilterCompany] = useState(companies);
    const navigate = useNavigate();

    useEffect(() => {
        const filteredCompany = companies.length >= 0 && companies.filter((company) => {
            if (!searchCompanyByText) return true;
            return company?.name?.toLowerCase().includes(searchCompanyByText.toLowerCase());
        });
        setFilterCompany(filteredCompany);
    }, [companies, searchCompanyByText]);

    const deleteCompanyHandler = async (companyId) => {
        if (!confirm("Delete this company? All jobs and applications linked to it will also be deleted.")) return;
        try {
            const res = await axios.delete(`${COMPANY_API_END_POINT}/delete/${companyId}`, { withCredentials: true });
            if (res.data.success) {
                setCompanies(companies.filter(c => c._id !== companyId));
                toast.success("Company deleted.");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete company.");
        }
    };

    return (
        <section className="company-directory-card" aria-label="Your companies">
            <div className="company-directory-list-heading"><span>COMPANY</span><span>ADDED</span><span aria-label="Actions" /></div>
            {filterCompany?.length ? filterCompany.map(company => <article className="company-directory-row" key={company._id}>
                <div className="company-directory-logo">{company.logo ? <img src={company.logo} alt={`${company.name} logo`} /> : <Building2 size={21} />}</div>
                <div className="company-directory-info"><h2>{company.name}</h2><p><MapPin size={13} />{company.location || 'Location not added'}</p>{company.description && <small>{company.description}</small>}</div>
                <time className="company-directory-date" dateTime={company.createdAt || undefined}>{company.createdAt ? new Date(company.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</time>
                <div className="company-directory-action"><Popover>
                    <PopoverTrigger asChild><button type="button" aria-label={`Actions for ${company.name}`} className="company-directory-more"><MoreHorizontal size={19} /></button></PopoverTrigger>
                    <PopoverContent align="end" className="w-36 company-directory-menu">
                        <button type="button" onClick={() => navigate(`/admin/companies/${company._id}`)}><Edit2 size={15} /><span>Edit details</span></button>
                        <button type="button" onClick={() => deleteCompanyHandler(company._id)} className="is-danger"><Trash2 size={15} /><span>Delete company</span></button>
                    </PopoverContent>
                </Popover></div>
            </article>) : <div className="company-directory-empty"><Building2 size={25} /><strong>{searchCompanyByText ? 'No companies found' : 'No companies yet'}</strong><span>{searchCompanyByText ? 'Try a different company name.' : 'Add a company to start managing your hiring profile.'}</span></div>}
            <div className="company-directory-footer">{filterCompany?.length || 0} {filterCompany?.length === 1 ? 'company' : 'companies'} in your workspace</div>
        </section>
    )
}

export default CompaniesTable
