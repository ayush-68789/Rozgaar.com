import React, { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { ArrowLeft, Building2, Globe2, ImagePlus, Loader2, MapPin, Save } from 'lucide-react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import axios from 'axios'
import { COMPANY_API_END_POINT } from '@/utils/constant'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApp } from '@/context/AppContext'
import useGetCompanyById from '@/hooks/useGetCompanyById'

const CompanySetup = () => {
    const params = useParams();
    useGetCompanyById(params.id);
    const [input, setInput] = useState({
        name: "",
        description: "",
        website: "",
        location: "",
        file: null
    });
    const [saving, setSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState('');
    const { singleCompany } = useApp();
    const navigate = useNavigate();

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    }

    const changeFileHandler = (e) => {
        const file = e.target.files?.[0];
        setInput({ ...input, file });
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("name", input.name);
        formData.append("description", input.description);
        formData.append("website", input.website);
        formData.append("location", input.location);
        if (input.file) {
            formData.append("file", input.file);
        }
        try {
            setSaving(true);
            const res = await axios.put(`${COMPANY_API_END_POINT}/update/${params.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });
            if (res.data.success) {
                toast.success(res.data.message);
                navigate("/admin/companies");
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "An error occurred");
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        setInput({
            name: singleCompany?.name || "",
            description: singleCompany?.description || "",
            website: singleCompany?.website || "",
            location: singleCompany?.location || "",
            file: null
        })
    },[singleCompany]);

    useEffect(() => {
        if (!input.file) {
            setLogoPreview('');
            return;
        }
        const previewUrl = URL.createObjectURL(input.file);
        setLogoPreview(previewUrl);
        return () => URL.revokeObjectURL(previewUrl);
    }, [input.file]);

    return (
        <div className="app-page admin-page">
            <div className="company-setup-layout">
                <form onSubmit={submitHandler} className="company-setup-card">
                    <header className="company-setup-heading">
                        <button type="button" onClick={() => navigate("/admin/companies")} className="company-setup-back"><ArrowLeft size={17} /> Back to companies</button>
                        <div className="company-setup-title-row"><span className="company-setup-icon"><Building2 size={21} /></span><div><h1>Company setup</h1><p>Keep your company profile current so candidates know who they’ll be applying to.</p></div></div>
                    </header>
                    <div className="company-setup-body">
                        <section className="company-setup-fields">
                            <div className="company-setup-section-heading"><h2>Company details</h2><p>These details appear on your job listings.</p></div>
                            <div className="company-setup-grid">
                                <div className="company-setup-field"><Label htmlFor="company-name">Company name</Label><Input id="company-name" type="text" name="name" value={input.name} onChange={changeEventHandler} placeholder="e.g. Acme Technologies" required /></div>
                                <div className="company-setup-field"><Label htmlFor="company-website">Website <span>(optional)</span></Label><div className="company-setup-input-icon"><Globe2 size={17} /><Input id="company-website" type="url" name="website" value={input.website} onChange={changeEventHandler} placeholder="https://company.com" /></div></div>
                                <div className="company-setup-field"><Label htmlFor="company-location">Location</Label><div className="company-setup-input-icon"><MapPin size={17} /><Input id="company-location" type="text" name="location" value={input.location} onChange={changeEventHandler} placeholder="City, Country or Remote" /></div></div>
                                <div className="company-setup-field company-setup-field-wide"><Label htmlFor="company-description">Company description</Label><textarea id="company-description" name="description" value={input.description} onChange={changeEventHandler} placeholder="Tell candidates what your company does and what makes it a great place to work." rows={4} /></div>
                            </div>
                        </section>
                        <section className="company-logo-section">
                            <div><h2>Company logo</h2><p>Use a clear square image for the best results.</p></div>
                            <div className="company-logo-upload-row">
                                <div className="company-logo-preview">{logoPreview || singleCompany?.logo ? <img src={logoPreview || singleCompany.logo} alt={`${input.name || singleCompany.name} logo`} /> : <Building2 size={25} />}</div>
                                <div className="company-logo-upload-copy"><strong>{input.file?.name || (singleCompany?.logo ? 'Current logo' : 'Add a company logo')}</strong><span>PNG, JPG or WEBP</span></div>
                                <label htmlFor="company-logo" className="company-logo-upload-button"><ImagePlus size={16} /> Choose image</label>
                                <Input id="company-logo" className="company-logo-file-input" type="file" accept="image/*" onChange={changeFileHandler} />
                            </div>
                        </section>
                    </div>
                    <footer className="company-setup-actions"><span>Changes will update your company profile.</span><Button type="submit" disabled={saving || !input.name.trim()} className="company-setup-save">{saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save changes</>}</Button></footer>
                </form>
            </div>
        </div>
    )
}

export default CompanySetup
