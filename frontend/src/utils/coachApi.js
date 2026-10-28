import axios from 'axios'
import { COACH_API_END_POINT } from '@/utils/constant'

const client = axios.create({ baseURL: COACH_API_END_POINT, withCredentials: true })

export const coachApi = {
    overview: () => client.get('/overview').then(r => r.data),
    recommendations: () => client.get('/recommendations').then(r => r.data),
    fit: jobId => client.get(`/fit/${jobId}`).then(r => r.data),
    goal: goal => client.post('/goal', { goal }).then(r => r.data),
    planForJob: (jobId, refresh = false) => client.post(`/plan/job/${jobId}`, { refresh }).then(r => r.data),
    plan: id => client.get(`/plan/${id}`).then(r => r.data),
    deletePlan: id => client.delete(`/plan/${id}`).then(r => r.data),
    startQuiz: (planId, week) => client.post(`/plan/${planId}/week/${week}/quiz`).then(r => r.data),
    submitQuiz: (planId, week, quizToken, answers) => client.post(`/plan/${planId}/week/${week}/submit`, { quizToken, answers }).then(r => r.data),
    analyzeResume: jobId => client.post('/resume/analyze', { jobId: jobId || undefined }).then(r => r.data),
    addSkills: skills => client.post('/skills/add', { skills }).then(r => r.data),
    addProject: project => client.post('/projects', project).then(r => r.data),
    deleteProject: id => client.delete(`/projects/${id}`).then(r => r.data),
    news: topics => client.get('/news', { params: topics?.length ? { topics: topics.join(',') } : {} }).then(r => r.data),
}

export const errorMessage = (error, fallback = 'Something went wrong.') => error?.response?.data?.message || fallback
