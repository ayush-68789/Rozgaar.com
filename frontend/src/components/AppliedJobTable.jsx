import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { useApp } from '@/context/AppContext'
import axios from 'axios'
import { APPLICATION_API_END_POINT } from '@/utils/constant'
import { toast } from 'react-toastify'
import { ExternalLink, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const stageLabels = { pending: 'Applied', shortlisted: 'Shortlisted', interview: 'Interview', offered: 'Offer made', accepted: 'Hired', rejected: 'Not selected' };

const AppliedJobTable = () => {
    const { allAppliedJobs, setAllAppliedJobs } = useApp();

    const withdrawHandler = async (applicationId) => {
        if (!confirm("Are you sure you want to withdraw this application?")) return;
        try {
            const res = await axios.delete(`${APPLICATION_API_END_POINT}/delete/${applicationId}`, { withCredentials: true });
            if (res.data.success) {
                setAllAppliedJobs(allAppliedJobs.filter(job => job._id !== applicationId));
                toast.success("Application withdrawn.");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to withdraw application.");
        }
    };

    return (
        <div className="applications-table-wrap">
            <Table className="applications-table">
                <TableHeader>
                    <TableRow>
                        <TableHead>Opportunity</TableHead>
                        <TableHead>Applied on</TableHead>
                        <TableHead>Application status</TableHead>
                        <TableHead>View job</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        allAppliedJobs.length <= 0
                            ? <tr><td colSpan={5} className="applications-empty">You haven’t applied to any jobs yet. Your applications will appear here.</td></tr>
                            : allAppliedJobs.map((appliedJob) => (
                                <TableRow key={appliedJob._id}>
                                    <TableCell><div className="application-opportunity"><strong>{appliedJob.job?.title || 'Job opening'}</strong><span>{appliedJob.job?.company?.name || 'Company'}</span></div></TableCell>
                                    <TableCell>{appliedJob?.createdAt ? new Date(appliedJob.createdAt).toLocaleDateString() : '—'}</TableCell>
                                    <TableCell>
                                        <Badge className={`application-status status-${appliedJob?.status || 'pending'}`}>
                                            {stageLabels[appliedJob.status] || 'Applied'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{appliedJob.job?._id ? <Link className="application-view-link" to={`/description/${appliedJob.job._id}`}>View details <ExternalLink size={14} /></Link> : <span className="application-unavailable">Unavailable</span>}</TableCell>
                                    <TableCell className="text-right">
                                        {appliedJob.status === 'pending' && (
                                            <button
                                                onClick={() => withdrawHandler(appliedJob._id)}
                                                className="application-withdraw"
                                                title="Withdraw application"
                                            >
                                                <Trash2 size={14} />
                                                Withdraw
                                            </button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                    }
                </TableBody>
            </Table>
        </div>
    )
}

export default AppliedJobTable
