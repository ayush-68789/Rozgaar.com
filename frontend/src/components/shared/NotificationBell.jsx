import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { NOTIFICATION_API_END_POINT } from '@/utils/constant'
import '@/styles/coach.css'

const timeAgo = date => {
    const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`
    return `${Math.round(minutes / 1440)}d ago`
}

const NotificationBell = () => {
    const [items, setItems] = useState([])
    const [unread, setUnread] = useState(0)
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()

    const load = useCallback(async () => {
        try {
            const res = await axios.get(NOTIFICATION_API_END_POINT, { withCredentials: true })
            setItems(res.data.notifications || [])
            setUnread(res.data.unreadCount || 0)
        } catch {
            // the bell is optional UI: stay silent when offline
        }
    }, [])

    useEffect(() => {
        load()
        const timer = setInterval(load, 60000)
        return () => clearInterval(timer)
    }, [load])

    const openItem = async item => {
        setOpen(false)
        if (!item.read) {
            axios.post(`${NOTIFICATION_API_END_POINT}/${item._id}/read`, {}, { withCredentials: true }).then(load).catch(() => {})
        }
        if (item.link) navigate(item.link)
    }

    const readAll = async () => {
        await axios.post(`${NOTIFICATION_API_END_POINT}/read-all`, {}, { withCredentials: true }).catch(() => {})
        load()
    }

    return (
        <Popover open={open} onOpenChange={next => { setOpen(next); if (next) load() }}>
            <PopoverTrigger asChild>
                <button type="button" className="notif-trigger" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
                    <Bell size={19} />
                    {unread > 0 && <span className="notif-dot">{unread > 9 ? '9+' : unread}</span>}
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={10} className="w-80 p-0">
                <div className="coach-row" style={{ justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #eef2f8' }}>
                    <strong>Notifications</strong>
                    {unread > 0 && <button type="button" className="coach-muted" style={{ background: 'none', border: 0, cursor: 'pointer', color: '#1769d2' }} onClick={readAll}>Mark all read</button>}
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto', padding: '0 8px' }}>
                    {items.length === 0 && <p className="coach-empty" style={{ padding: 16 }}>You’re all caught up.</p>}
                    {items.map(item => (
                        <button type="button" key={item._id} className={`notif-item${item.read ? '' : ' unread'}`} onClick={() => openItem(item)}>
                            <strong>{item.title}</strong>
                            <span className="coach-muted">{item.message}</span>
                            <small>{timeAgo(item.createdAt)}</small>
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default NotificationBell
