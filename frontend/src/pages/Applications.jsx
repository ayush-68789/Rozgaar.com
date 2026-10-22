import React from 'react'
import Navbar from '../components/shared/Navbar'
import Footer from '../components/shared/Footer'
import AppliedJobTable from '../components/AppliedJobTable'
import useGetAppliedJobs from '@/hooks/useGetAppliedJobs'
import { useApp } from '@/context/AppContext'

const Applications = () => {
    useGetAppliedJobs()
    const { allAppliedJobs } = useApp()
    const applicationCount = allAppliedJobs?.length || 0

    return (
        <div className="job-portal-home applications-page">
            <Navbar />
            <main className="applications-page-main">
                <section className="applications-panel" aria-labelledby="applications-title">
                    <header className="applications-page-heading">
                        <div>
                            <h1 id="applications-title">My Applications</h1>
                            <p>Track your applications and their latest status.</p>
                        </div>
                        <span className="applications-count">{applicationCount} {applicationCount === 1 ? 'application' : 'applications'}</span>
                    </header>
                    <AppliedJobTable />
                </section>
            </main>
            <Footer />
        </div>
    )
}

export default Applications
