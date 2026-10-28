const tone = score => (score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low')

const ReadinessBadge = ({ score, label = 'match' }) => {
    if (score === undefined || score === null) return null
    return <span className={`coach-badge ${tone(score)}`} title="How many of the job's listed skills are on your profile">{score}% {label}</span>
}

export default ReadinessBadge
