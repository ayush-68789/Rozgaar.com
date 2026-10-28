import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'

// Career-coach pages are for candidate accounts only.
const StudentRoute = ({ children }) => {
    const { user, isAuthChecking } = useApp()
    const navigate = useNavigate()

    useEffect(() => {
        if (isAuthChecking) return
        if (!user) navigate('/login')
        else if (user.role !== 'student') navigate('/')
    }, [user, isAuthChecking, navigate])

    if (isAuthChecking || !user || user.role !== 'student') return null
    return children
}

export default StudentRoute
