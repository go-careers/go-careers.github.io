import JobCards from '../../job-cards/JobCards'
import SwitchTheme from '../../custom-icons/SwitchTheme'
import SideFilter from '../../filters/common/SideFilter'
import { useState, useEffect } from 'react'
import { GetJobsResponse, getJobs } from '../../../utils/ApiUtils'
import { JobCardProps } from '../../job-cards/JobCard'
import { transformToJobCardsModel } from '../../../utils/TransformerUtils'
import { useInViewTrigger } from '../../../hooks/ScrollHooks'
import { FIRST_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from '../../../configs/ApiConfigs'
import { useJobLocations } from '../../../hooks/LocationHooks'
import SideFilterMultiselect from '../../filters/common/SideFilterMultiselect'
import { multipleSelectedLocationDisplayText } from '../../../utils/CommonUtils'

interface LandingPageProps {
}

{/* TODO: Refactor this shit!!! */}
const LandingPage = (_props: LandingPageProps) => {
  const [jobType, setJobType] = useState<string>()
  const [locations, setLocations] = useState<string[]>([])
  const [jobLevel, setJobLevel] = useState<string>()
  const [jobs, setJobs] = useState<JobCardProps[]>([])
  const [pageNumber, setPageNumber] = useState<number>(FIRST_PAGE_NUMBER)
  const [endOfList, setEndOfList] = useState<boolean>(false)
  const { locationOptions, locationIdNameMap } = useJobLocations()

  const fetchJobs = (page_no: number = FIRST_PAGE_NUMBER): Promise<GetJobsResponse>  => {
    return getJobs({
      page_no,
      page_size: DEFAULT_PAGE_SIZE,
      job_filter: {
        location_ids: locations,
        job_type: jobType,
        experience_type: jobLevel
      }
    })
  }

  const addJobsToList = (freshList: boolean = false) => {
    if (freshList) {
      setEndOfList(false)
    }
    else if (endOfList) {
      // Do not fetch list if alread reached end of list
      return
    }

    fetchJobs(freshList? FIRST_PAGE_NUMBER: pageNumber)
      .then(transformToJobCardsModel)
      .then((newList) => {
        if (!newList?.length) {
          setEndOfList(true)
        }
        setJobs((prevList) => [...(freshList? []: prevList), ...newList])
      })
      .then(() => setPageNumber((currentPageNumber) => (freshList? FIRST_PAGE_NUMBER: currentPageNumber) + 1))
  }

  const pageEndRef = useInViewTrigger(addJobsToList)

  useEffect(() => {
    addJobsToList(true)
  }, [jobType, locations, jobLevel])

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
          <div className="search-job">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-briefcase">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>
            {jobLevel ?? <input type="text" placeholder="All Seniority Levels" disabled/>}
          </div>
          <div className="search-location">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-map-pin">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {!locations.length ? <input type="text" placeholder="All Locations" disabled/>: multipleSelectedLocationDisplayText(locations, locationIdNameMap)}
          </div>
          <button className="search-button" onClick={() => addJobsToList(true)}>Find Job</button>
        </div>

        <div className="main-container">
          <div className="search-type">
            <SideFilter
              filterTitle='Job Type'
              options={[{
                id: 'App Developer'
              }, {
                id: 'Data Analyst'
              }, {
                id: 'Data Scientist'
              }, {
                id: 'Web Developer'
              }, {
                id: 'SDE',
                displayText: 'Software Engineer (SDE)'
              }]}
              selectedOption={jobType}
              updateSelection={setJobType}
            />
            <SideFilter
              filterTitle='Seniority Level'
              options={[{
                id: 'Entry Level'
              }, {
                id: 'Associate'
              }]}
              selectedOption={jobLevel}
              updateSelection={setJobLevel}
            />
            <SideFilterMultiselect
              filterTitle='Location'
              options={locationOptions ?? []}
              selectedOptions={locations}
              updateSelection={setLocations}
            />
          </div>
          <div className="searched-jobs">
            <JobCards
              cardProps={jobs}
            />
          </div>
        </div>
        <div ref={pageEndRef}></div>
      </div>
    </div>
  )
}

export default LandingPage