import axios from 'axios'
import { toast } from 'react-toastify'
import { USER_API_END_POINT } from './constant'

export const downloadResume = async (url, fileName = 'resume.pdf') => {
    try {
        const response = await axios.get(`${USER_API_END_POINT}/resume/download`, {
            params: { url, filename: fileName },
            responseType: 'blob',
            withCredentials: true
        })
        const objectUrl = URL.createObjectURL(new Blob([response.data]))
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = fileName || 'resume.pdf'
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to download this resume.')
    }
}
