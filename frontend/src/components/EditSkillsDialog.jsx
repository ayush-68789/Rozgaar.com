import React, { useEffect, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useApp } from '@/context/AppContext'
import { USER_API_END_POINT } from '@/utils/constant'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'

const EditSkillsDialog = ({ open, setOpen }) => {
    const { user, setUser } = useApp()
    const [skills, setSkills] = useState([])
    const [draft, setDraft] = useState('')
    const [loading, setLoading] = useState(false)
    const inputRef = useRef(null)

    useEffect(() => {
        if (!open) return
        setSkills(user?.profile?.skills || [])
        setDraft('')
    }, [open, user])

    const addSkills = (value) => {
        const incoming = value.split(',').map(skill => skill.trim()).filter(Boolean)
        if (!incoming.length) return
        setSkills(current => incoming.reduce((list, skill) => list.some(item => item.toLowerCase() === skill.toLowerCase()) ? list : [...list, skill], current))
        setDraft('')
    }

    const inputKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault()
            addSkills(draft)
        } else if (event.key === 'Backspace' && !draft && skills.length) {
            setSkills(current => current.slice(0, -1))
        }
    }

    const submitHandler = async (event) => {
        event.preventDefault()
        const nextSkills = [...skills]
        if (draft.trim()) nextSkills.push(draft.trim())
        const uniqueSkills = nextSkills.reduce((list, skill) => list.some(item => item.toLowerCase() === skill.toLowerCase()) ? list : [...list, skill], [])
        const formData = new FormData()
        formData.append('skills', uniqueSkills.join(', '))
        try {
            setLoading(true)
            const response = await axios.post(`${USER_API_END_POINT}/profile/update`, formData, { withCredentials: true })
            if (response.data.success) {
                setUser(response.data.user)
                toast.success('Skills updated.')
                setOpen(false)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not update your skills.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="skills-editor-dialog">
                <DialogHeader className="skills-editor-header">
                    <DialogTitle>Key skills</DialogTitle>
                    <DialogDescription>Recruiters look for candidates with specific key skills. Add the skills you want employers to find.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submitHandler}>
                    <div className="skills-entry-box" onClick={() => inputRef.current?.focus()}>
                        {skills.map((skill, index) => <span className="skill-entry-chip" key={`${skill}-${index}`}>{skill}<button type="button" aria-label={`Remove ${skill}`} onClick={() => setSkills(current => current.filter((_, itemIndex) => itemIndex !== index))}><X size={13} /></button></span>)}
                        <input ref={inputRef} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={inputKeyDown} onBlur={() => draft.trim() && addSkills(draft)} placeholder="Enter your key skills" aria-label="Enter a skill" />
                    </div>
                    <p className="skills-editor-hint">Press Enter or comma after each skill. Select × to remove a skill.</p>
                    <DialogFooter className="skills-editor-footer">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving</> : 'Save'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default EditSkillsDialog
