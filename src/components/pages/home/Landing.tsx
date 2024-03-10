import JobCards from '../../job-cards/JobCards'
import SwitchTheme from '../../custom-icons/SwitchTheme'
import SideFilter from '../../filters/common/SideFilter'
import { useState, useEffect } from 'react'
import { getJobs } from '../../../utils/ApiUtils'
import { JobCardProps } from '../../job-cards/JobCard'
import { transformToJobCardsModel } from '../../../utils/TransformerUtils'

interface LandingPageProps {
}

{/* TODO: Refactor this shit!!! */}
const LandingPage = (_props: LandingPageProps) => {
  const [jobType, setJobType] = useState<string>()
  const [location, setLocation] = useState<string>()
  const [jobLevel, setJobLevel] = useState<string>()
  const [jobs, setJobs] = useState<JobCardProps[]>([])

  const fetchJobs = () => {
    getJobs({
      location,
      job_type: jobType,
      experience_type: jobLevel
    })
      .then(transformToJobCardsModel)
      .then(setJobs)
  }

  useEffect(() => {
    fetchJobs()
  }, [jobType, location, jobLevel])

  return (
    <div className="job">
      <div className="header">
        <div className="logo">
          <img src='./favicon.ico' style={{ height: '50px', width: '50px' }}/>
        </div>
        <div className="user-settings">
          <SwitchTheme/>
        </div>
      </div>
      <div className="wrapper">
        <div className="search-menu">
          <div className="search-job">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            {jobType ?? <input type="text" placeholder="All Job Types" disabled/>}
          </div>
          <div className="search-location">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-map-pin">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {location ?? <input type="text" placeholder="All Locations" disabled/>}
          </div>
          <div className="search-job">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-briefcase">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>
            {jobLevel ?? <input type="text" placeholder="All Seniority Levels" disabled/>}
          </div>
          <button className="search-button" onClick={fetchJobs}>Find Job</button>
        </div>

        <div className="main-container">
          <div className="search-type">
            <SideFilter
              filterTitle='Job Type'
              options={[{
                id: 'Software Engineer'
              }, {
                id: 'Frontend Developer'
              }, {
                id: 'App Developer'
              }, {
                id: 'Data Scientist'
              }]}
              selectedOption={jobType}
              updateSelection={setJobType}
            />
            <SideFilter
              filterTitle='Location'
              options={[{
                id: 'Bangalore'
              }, {
                id: 'Gurgaon'
              }, {
                id: 'Mumbai'
              }, {
                id: 'Hyderabad'
              }]}
              selectedOption={location}
              updateSelection={setLocation}
            />
            <SideFilter
              filterTitle='Seniority Level'
              options={[{
                id: 'Intern'
              }, {
                id: 'Entry Level'
              }, {
                id: 'Mid Senior Level'
              }]}
              selectedOption={jobLevel}
              updateSelection={setJobLevel}
            />
          </div>
          <div className="searched-jobs">
            <JobCards
              cardProps={jobs}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage