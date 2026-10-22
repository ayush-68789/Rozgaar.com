import React, { useState } from 'react'
import Navbar from './shared/Navbar'
import Footer from './shared/Footer'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Contact, FileText, Mail, Pen } from 'lucide-react'
import { Badge } from './ui/badge'

import UpdateProfileDialog from './UpdateProfileDialog'
import EditSkillsDialog from './EditSkillsDialog'
import UpdateResumeDialog from './UpdateResumeDialog'
import { useApp } from '@/context/AppContext'
import { downloadResume } from '@/utils/resume'



const Profile = () => {
    const [open, setOpen] = useState(false);
    const [skillsOpen, setSkillsOpen] = useState(false);
    const [resumeOpen, setResumeOpen] = useState(false);
    const { user } = useApp();

    return (
        <div className="app-page profile-page">
            <Navbar />
            <main className="profile-page-main">
                <section className="profile-overview-card" aria-label="Profile overview">
                    <div className="profile-overview-top">
                        <div className="profile-person">
                            <Avatar className="profile-photo">
                                <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname || 'Profile'} />
                                <AvatarFallback>{user?.fullname?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="profile-person-copy">
                                <h1>{user?.fullname || 'Your profile'}</h1>
                                {user?.profile?.bio && <p>{user.profile.bio}</p>}
                            </div>
                        </div>
                        <button type="button" onClick={() => setOpen(true)} className="profile-edit-button" aria-label="Edit profile"><Pen size={17} /><span>Edit profile</span></button>
                    </div>
                    <div className="profile-contact-grid">
                        <div className="profile-contact-item"><span className="profile-contact-icon"><Mail size={17} /></span><div><small>Email address</small><span>{user?.email || 'Not added'}</span></div></div>
                        <div className="profile-contact-item"><span className="profile-contact-icon"><Contact size={17} /></span><div><small>Phone number</small><span>{user?.phoneNumber || 'Not added'}</span></div></div>
                    </div>
                </section>
                <div className="profile-detail-grid">
                    <section className="profile-detail-card" aria-labelledby="profile-skills-title">
                        <header><div><h2 id="profile-skills-title">Skills</h2><p>Your listed skills</p></div><button type="button" onClick={() => setSkillsOpen(true)} className="profile-section-edit" aria-label="Edit skills"><Pen size={15} /></button></header>
                        <div className="profile-skill-list">
                            {user?.profile?.skills?.length ? user.profile.skills.map((item, index) => <Badge className="profile-skill-chip" key={`${item}-${index}`}>{item}</Badge>) : <span className="profile-empty-value">No skills added yet</span>}
                        </div>
                    </section>
                    <section className="profile-detail-card" aria-labelledby="profile-resume-title">
                        <header><div><h2 id="profile-resume-title">Resume</h2><p>Your resume for job applications</p></div><button type="button" onClick={() => setResumeOpen(true)} className="profile-section-edit" aria-label="Edit resume"><Pen size={15} /></button></header>
                        <div className="profile-resume-card">
                            <span className="profile-resume-icon"><FileText size={20} /></span>
                            <div className="profile-resume-copy"><strong>{user?.profile?.resumeName || 'No resume uploaded'}</strong><small>{user?.profile?.resumeName ? 'Ready to use with your applications' : 'Upload a resume to help employers review your application.'}</small></div>
                            {user?.profile?.resumeUrl ? <div className="profile-resume-actions"><button type="button" onClick={() => downloadResume(user.profile.resumeUrl, user.profile.resumeName)}>Download resume</button></div> : <button type="button" onClick={() => setResumeOpen(true)}>Upload</button>}
                        </div>
                    </section>
                </div>
            </main>
            <UpdateProfileDialog open={open} setOpen={setOpen}/>
            <EditSkillsDialog open={skillsOpen} setOpen={setSkillsOpen} />
            <UpdateResumeDialog open={resumeOpen} setOpen={setResumeOpen} />
            <Footer />
        </div>
    )
}

export default Profile
