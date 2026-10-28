import { Label } from './ui/label'
import { useApp } from '@/context/AppContext'

const filterData = [
    {
        filterType: "Location",
        array: ["Delhi NCR", "Bangalore", "Hyderabad", "Pune", "Mumbai", "Remote"]
    },
    {
        filterType: "Industry",
        array: ["Frontend Developer", "Backend Developer", "FullStack Developer", "Data Science", "DevOps"]
    },
    {
        filterType: "Salary",
        array: ["₹0–40,000 / month", "₹40,000–1,00,000 / month", "₹1,00,000–5,00,000 / month", "₹5,00,000+ / month"]
    },
    {
        filterType: "Experience",
        array: ["Fresher", "0–1 years", "1–3 years", "3–5 years", "5+ years"]
    },
]

const FilterCard = () => {
    const { jobFilters, setJobFilters } = useApp();
    const filterKeys = { Location: 'location', Industry: 'industry', Salary: 'salary', Experience: 'experience' };
    const selectedValues = value => Array.isArray(value) ? value : value ? [value] : [];

    return (
        <div className='filter-card w-full bg-white p-3 rounded-md shadow-sm border border-gray-100'>
            <h1 className='filter-card-title font-bold text-lg'>Filter Jobs</h1>
            <hr className='filter-card-divider mt-3' />
            {
                filterData.map((data, index) => {
                    const filterKey = filterKeys[data.filterType];
                    return <div key={data.filterType}>
                            <div className='filter-card-section-heading flex items-center justify-between mt-3'>
                                <h2 className='font-bold text-base'>{data.filterType}</h2>
                                {selectedValues(jobFilters[filterKey]).length > 0 && <button type='button' className='filter-card-clear text-xs text-blue-600' onClick={() => setJobFilters(current => ({ ...current, [filterKey]: data.filterType === 'Experience' ? '' : [] }))}>Clear</button>}
                            </div>
                            <div>
                            {
                                data.array.map((item, idx) => {
                                    const itemId = `id${index}-${idx}`
                                    const experienceValues = { 'Fresher': 'fresher', '0–1 years': '0-1', '1–3 years': '1-3', '3–5 years': '3-5', '5+ years': '5+' };
                                    const filterValue = data.filterType === 'Experience' ? experienceValues[item] : item;
                                    const checked = selectedValues(jobFilters[filterKey]).includes(filterValue);
                                    return (
                                        <div key={idx} className='filter-card-option flex items-center space-x-2 my-2'>
                                            <input className='filter-checkbox' type='checkbox' checked={checked} onChange={() => setJobFilters(current => {
                                                const values = selectedValues(current[filterKey]);
                                                if (data.filterType === 'Experience') return { ...current, [filterKey]: checked ? '' : filterValue };
                                                return { ...current, [filterKey]: checked ? values.filter(value => value !== filterValue) : [...values, filterValue] };
                                            })} id={itemId} />
                                            <Label htmlFor={itemId}>{item}</Label>
                                        </div>
                                    )
                                })
                            }
                            </div>
                        </div>
                })
            }
        </div>
    )
}

export default FilterCard
