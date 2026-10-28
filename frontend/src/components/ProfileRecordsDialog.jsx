import { useEffect, useState } from 'react'
import axios from 'axios'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { useApp } from '@/context/AppContext'
import { USER_API_END_POINT } from '@/utils/constant'

const createEmptyRecord = fields => Object.fromEntries(fields.map(field => [field.name, field.type === 'checkbox' ? false : '']))

const ProfileRecordsDialog = ({ open, setOpen, section, title, description, records = [], fields }) => {
    const { setUser } = useApp()
    const [drafts, setDrafts] = useState([])
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!open) return
        setDrafts(records.length ? records.map(record => Object.fromEntries(fields.map(field => [field.name, field.name === 'skills' && Array.isArray(record[field.name]) ? record[field.name].join(', ') : record[field.name] ?? (field.type === 'checkbox' ? false : '')]))) : [createEmptyRecord(fields)])
    }, [open, records, fields])

    const updateField = (index, name, value) => setDrafts(current => current.map((record, row) => row === index ? { ...record, [name]: value } : record))

    const submit = async event => {
        event.preventDefault()
        const cleanRecords = drafts.map(record => Object.fromEntries(fields.map(field => [field.name, field.name === 'skills' ? String(record[field.name] || '').split(',').map(skill => skill.trim()).filter(Boolean) : record[field.name]])))
        try {
            setSaving(true)
            const response = await axios.put(`${USER_API_END_POINT}/profile/sections/${section}`, { records: cleanRecords }, { withCredentials: true })
            if (response.data.success) {
                setUser(response.data.user)
                toast.success(`${title} saved.`)
                setOpen(false)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Could not save ${title.toLowerCase()}.`)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="profile-records-dialog">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit}>
                    <div className="profile-record-editor-list">
                        {drafts.map((record, index) => <fieldset className="profile-record-editor" key={index}>
                            <legend>{title} {index + 1}</legend>
                            <button type="button" className="profile-record-remove" onClick={() => setDrafts(current => current.filter((_, row) => row !== index))} aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}><Trash2 size={15} /></button>
                            <div className="profile-record-fields">
                                {fields.map(field => <label className={`profile-record-field${field.type === 'textarea' ? ' is-wide' : ''}${field.type === 'checkbox' ? ' is-checkbox' : ''}`} key={field.name}>
                                    {field.type === 'checkbox' ? <><input type="checkbox" checked={Boolean(record[field.name])} onChange={event => updateField(index, field.name, event.target.checked)} /><span>{field.label}</span></> : <>
                                        <span>{field.label}{field.required && <b> *</b>}</span>
                                        {field.type === 'textarea' ? <textarea value={record[field.name] || ''} onChange={event => updateField(index, field.name, event.target.value)} placeholder={field.placeholder || ''} rows={3} /> : <input type={field.type || 'text'} value={record[field.name] || ''} onChange={event => updateField(index, field.name, event.target.value)} placeholder={field.placeholder || ''} required={field.required} pattern={field.type === 'url' ? 'https://.*' : undefined} />}
                                    </>}
                                </label>)}
                            </div>
                        </fieldset>)}
                    </div>
                    <button type="button" className="profile-record-add" onClick={() => setDrafts(current => [...current, createEmptyRecord(fields)])}><Plus size={16} />Add another</button>
                    <DialogFooter className="profile-record-editor-footer">
                        <button type="button" className="profile-record-cancel" onClick={() => setOpen(false)}>Cancel</button>
                        <button type="submit" className="profile-record-save" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default ProfileRecordsDialog
