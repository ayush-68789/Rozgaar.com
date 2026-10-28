import React from 'react'
import OpportunityLayout from '../components/shared/OpportunityLayout'
import AppliedJobTable from '../components/AppliedJobTable'
import StudentRoute from '@/components/coach/StudentRoute'
import useGetAppliedJobs from '@/hooks/useGetAppliedJobs'
import { useApp } from '@/context/AppContext'

const ApplicationsContent = () => {
    useGetAppliedJobs()
    const { allAppliedJobs } = useApp()
    const applicationCount = allAppliedJobs?.length || 0

    return (
        <OpportunityLayout activePage="My Applications" breadcrumb="My Applications">
        <div className="job-portal-home applications-page">
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
        </div>
        </OpportunityLayout>
    )
}

const Applications = () => <StudentRoute><ApplicationsContent /></StudentRoute>

export default Applications
