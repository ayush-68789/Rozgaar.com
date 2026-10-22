import { useEffect, useState } from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Edit2, Eye, MoreHorizontal, Trash2, PowerOff, Power } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { JOB_API_END_POINT } from '@/utils/constant'
import { toast } from 'react-toastify'

const AdminJobsTable = () => {
    const { allAdminJobs, setAllAdminJobs, searchJobByText } = useApp();
    const [filterJobs, setFilterJobs] = useState(allAdminJobs);
    const navigate = useNavigate();

    useEffect(() => {
        const filteredJobs = allAdminJobs.filter((job) => {
            if (!searchJobByText) return true;
            return job?.title?.toLowerCase().includes(searchJobByText.toLowerCase())
                || job?.company?.name.toLowerCase().includes(searchJobByText.toLowerCase());
        });
        setFilterJobs(filteredJobs);
    }, [allAdminJobs, searchJobByText]);

    const deleteJobHandler = async (jobId) => {
        if (!confirm("Delete this job and all its applications?")) return;
        try {
            const res = await axios.delete(`${JOB_API_END_POINT}/delete/${jobId}`, { withCredentials: true });
            if (res.data.success) {
                setAllAdminJobs(allAdminJobs.filter(j => j._id !== jobId));
                toast.success("Job deleted.");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete job.");
        }
    };

    const toggleStatusHandler = async (jobId) => {
        try {
            const res = await axios.patch(`${JOB_API_END_POINT}/toggle/${jobId}`, {}, { withCredentials: true });
            if (res.data.success) {
                setAllAdminJobs(allAdminJobs.map(j =>
                    j._id === jobId ? { ...j, isOpen: res.data.isOpen } : j
                ));
                toast.success(res.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update job status.");
        }
    };

    return (
        <div>
            <Table>
                <TableCaption>A list of your recent posted jobs</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Company Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Application deadline</TableHead>
                        <TableHead>Applicants</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        filterJobs?.map((job) => (
                            <tr key={job._id}>
                                <TableCell>{job?.company?.name}</TableCell>
                                <TableCell>{job?.title}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job?.isOpen !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {job?.isOpen !== false ? 'Open' : 'Closed'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {job?.applicationDeadline ? new Date(job.applicationDeadline).toISOString().slice(0, 10) : 'Not set'}
                                    {job?.originalApplicationDeadline && job?.applicationDeadline && new Date(job.applicationDeadline) > new Date(job.originalApplicationDeadline) && <span className="ml-2 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Extended</span>}
                                </TableCell>
                                <TableCell>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)}
                                        className="font-medium text-blue-700 hover:underline"
                                        aria-label={`View ${job?.applications?.length || 0} applicants for ${job?.title}`}
                                    >
                                        {job?.applications?.length || 0}
                                    </button>
                                </TableCell>
                                <TableCell className="text-right cursor-pointer">
                                    <Popover>
                                        <PopoverTrigger><MoreHorizontal /></PopoverTrigger>
                                        <PopoverContent className="w-40">
                                            <div onClick={() => navigate(`/admin/jobs/${job._id}/edit`)} className='flex items-center gap-2 w-fit cursor-pointer py-1'>
                                                <Edit2 className='w-4' />
                                                <span>Edit</span>
                                            </div>
                                            <div onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)} className='flex items-center w-fit gap-2 cursor-pointer py-1'>
                                                <Eye className='w-4' />
                                                <span>Applicants</span>
                                            </div>
                                            <div onClick={() => toggleStatusHandler(job._id)} className='flex items-center w-fit gap-2 cursor-pointer py-1'>
                                                {job?.isOpen !== false ? <PowerOff className='w-4 text-orange-500' /> : <Power className='w-4 text-green-500' />}
                                                <span>{job?.isOpen !== false ? 'Close Job' : 'Reopen Job'}</span>
                                            </div>
                                            <div onClick={() => deleteJobHandler(job._id)} className='flex items-center w-fit gap-2 cursor-pointer py-1 text-red-500'>
                                                <Trash2 className='w-4' />
                                                <span>Delete</span>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                            </tr>
                        ))
                    }
                </TableBody>
            </Table>
        </div>
    )
}

export default AdminJobsTable
