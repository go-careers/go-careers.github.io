import JobCard, { JobCardProps } from './JobCard'
import '../../styles/styles.scss'

interface JobCardsProps {
  cardProps: JobCardProps[]
}

const JobCards = ({ cardProps }: JobCardsProps) => {
  return (
    <>
      <div className="searched-bar">
        <div className="searched-show">Showing {cardProps.length} Jobs</div>
      </div>
      <div className="job-cards">
        {cardProps.map((cardProp, index) => (
          <JobCard
            key={index}
            {...cardProp}
          />
        ))}
      </div>
    </>
  )
}

export default JobCards