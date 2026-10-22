import React, { useEffect, useRef, useState } from 'react'
import { FileText, Loader2, Upload } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useApp } from '@/context/AppContext'
import { USER_API_END_POINT } from '@/utils/constant'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'

const UpdateResumeDialog = ({ open, setOpen }) => {
    const { user, setUser } = useApp()
    const [resume, setResume] = useState(null)
    const [loading, setLoading] = useState(false)
    const inputRef = useRef(null)

    useEffect(() => {
        if (open) setResume(null)
    }, [open])

    const fileChangeHandler = (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Choose a resume under 5 MB.')
            event.target.value = ''
            return
        }
        if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
            toast.error('Upload a PDF, DOC, or DOCX resume.')
            event.target.value = ''
            return
        }
        setResume(file)
    }

    const submitHandler = async (event) => {
        event.preventDefault()
        if (!resume) {
            toast.error('Choose your new or updated resume first.')
            return
        }
        const formData = new FormData()
        formData.append('resume', resume)
        try {
            setLoading(true)
            const response = await axios.post(`${USER_API_END_POINT}/profile/update`, formData, { withCredentials: true })
            if (response.data.success) {
                setUser(response.data.user)
                toast.success('Resume updated.')
                setOpen(false)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not update your resume.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="resume-editor-dialog">
                <DialogHeader>
                    <DialogTitle>Upload a new resume</DialogTitle>
                    <DialogDescription>Choose a new or updated resume to replace the one on your profile.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submitHandler}>
                    <input ref={inputRef} className="resume-file-input" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={fileChangeHandler} />
                    <button type="button" className="resume-upload-choice" onClick={() => inputRef.current?.click()}>
                        {resume ? <FileText size={22} /> : <Upload size={22} />}
                        <strong>{resume?.name || user?.profile?.resumeName || 'Choose a resume file'}</strong>
                        <span>{resume ? 'Selected new resume' : user?.profile?.resumeName ? 'Choose a replacement file' : 'PDF, DOC, or DOCX · up to 5 MB'}</span>
                    </button>
                    <DialogFooter className="resume-editor-footer">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading || !resume}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading</> : 'Upload resume'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default UpdateResumeDialog
