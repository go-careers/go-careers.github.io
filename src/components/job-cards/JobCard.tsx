import '../../styles/styles.scss'
import '../../styles/jobCard.scss'

export interface JobCardProps {
  title: string;
  subTitle: string;
  tags?: string[];
  companyIcon: string;
  applicationUrl: string;
}

const JobCard = ({
  tags = [],
  title,
  subTitle,
  companyIcon,
  applicationUrl
}: JobCardProps) => {
  const startApplication = () => {
    window.open(applicationUrl, '_blank')
  }

  return (
    <div className="job-card">
      <div className="job-card-header">
        <img src={companyIcon} className='company-icon'/>
        {/*
          TODO: Ellipsis menu. Keeping for future. 
          <div className="menu-dot"></div> 
        */}
      </div>
      <div className="job-card-buttons">
        <button className="search-buttons card-buttons" onClick={startApplication}>
          Apply Now
        </button>
      </div>
      <div className="job-card-title">{title}</div>
      <div className="job-card-subtitle">{subTitle}</div>
      <div className="job-detail-buttons">
        {tags.map((tag) => (
          tag && <button key={tag} className="search-buttons detail-button">
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}

export default JobCard