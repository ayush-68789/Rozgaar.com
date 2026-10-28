import OpportunityLayout from '../shared/OpportunityLayout'
import '@/styles/coach.css'

const CoachShell = ({ title, subtitle, actions, children }) => (
    <OpportunityLayout activePage={title === 'Tech news' ? 'Tech News' : 'Career Coach'} breadcrumb={title}>
    <div className="coach-page">
        <main className="coach-main">
            <div className="coach-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>{title}</h1>
                    {subtitle && <p className="coach-sub">{subtitle}</p>}
                </div>
                {actions}
            </div>
            {children}
        </main>
    </div>
    </OpportunityLayout>
)

export default CoachShell
