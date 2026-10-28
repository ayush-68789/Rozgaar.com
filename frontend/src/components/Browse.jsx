import React, { useEffect } from 'react'
import OpportunityLayout from './shared/OpportunityLayout'
import JobCard from './JobCard'
import { useApp } from '@/context/AppContext'
import useGetAllJobs from '@/hooks/useGetAllJobs'

const Browse = () => {
    useGetAllJobs();
    const { allJobs, setSearchedQuery } = useApp();

    useEffect(() => {
        return () => {
            setSearchedQuery("");
        }
    }, [setSearchedQuery]);

    return (
        <OpportunityLayout activePage="Jobs" breadcrumb="Search results" searchPlaceholder="Search Jobs" showFooter>
        <div className="app-page browse-page">
            <div className='browse-layout'>
                <h1 className='font-bold text-xl my-10'>Search Results ({allJobs.length})</h1>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {
                        allJobs.map((job) => (
                            <JobCard key={job._id} job={job} />
                        ))
                    }
                </div>
            </div>
        </div>
        </OpportunityLayout>
    )
}

export default Browse
