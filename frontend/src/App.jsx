import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Home from './components/Home'
import Jobs from './components/Jobs'
import Browse from './components/Browse'
import Profile from './components/Profile'
import JobDescription from './components/JobDescription'
import Companies from './components/admin/Companies'
import CompanyCreate from './components/admin/CompanyCreate'
import CompanySetup from './components/admin/CompanySetup'
import AdminJobs from "./components/admin/AdminJobs";
import PostJob from './components/admin/PostJob'
import Applicants from './components/admin/Applicants'
import ProtectedRoute from './components/admin/ProtectedRoute'
import About from './pages/About'
import Contact from './pages/Contact'
import Applications from './pages/Applications'
import CompaniesDirectory from './pages/CompaniesDirectory'
import CoachDashboard from './pages/coach/CoachDashboard'
import PlanView from './pages/coach/PlanView'
import ResumeChecker from './pages/ResumeChecker'
import TechNews from './pages/coach/TechNews'


const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <Signup />
  },
  {
    path: '/about',
    element: <About />
  },
  {
    path: '/contact',
    element: <Contact />
  },
  {
    path: '/employer/login',
    element: <Login recruiterOnly />
  },
  {
    path: '/employer/register',
    element: <Signup recruiterOnly />
  },
  {
    path: "/jobs",
    element: <Jobs />
  },
  {
    path: "/description/:id",
    element: <JobDescription />
  },
  {
    path: "/browse",
    element: <Browse />
  },
  {
    path: "/profile",
    element: <Profile />
  },
  {
    path: "/applications",
    element: <Applications />
  },
  {
    path: "/companies",
    element: <CompaniesDirectory />
  },
  // AI career coach (Solvi) — candidate accounts only
  { path: '/coach', element: <CoachDashboard /> },
  { path: '/coach/plan/:id', element: <PlanView /> },
  { path: '/resume-checker', element: <ResumeChecker /> },
  { path: '/coach/resume', element: <Navigate to="/resume-checker" replace /> },
  { path: '/coach/news', element: <TechNews /> },
  // admin ke liye yha se start hoga
  {
    path:"/admin/companies",
    element: <ProtectedRoute><Companies/></ProtectedRoute>
  },
  {
    path:"/admin/companies/create",
    element: <ProtectedRoute><CompanyCreate/></ProtectedRoute> 
  },
  {
    path:"/admin/companies/:id",
    element:<ProtectedRoute><CompanySetup/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs",
    element:<ProtectedRoute><AdminJobs/></ProtectedRoute> 
  },
  {
    path:"/admin/applicants",
    element:<ProtectedRoute><Applicants/></ProtectedRoute>
  },
  {
    path:"/admin/jobs/create",
    element:<ProtectedRoute><PostJob/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs/:id/edit",
    element:<ProtectedRoute><PostJob/></ProtectedRoute>
  },
  {
    path:"/admin/jobs/:id/applicants",
    element:<ProtectedRoute><Applicants/></ProtectedRoute> 
  },

])
function App() {

  return (
    <div>
      <RouterProvider router={appRouter} />
    </div>
  )
}

export default App
