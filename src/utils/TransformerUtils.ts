import { JobCardProps } from '../components/job-cards/JobCard'
import { GetJobsResponse } from './ApiUtils'

export const transformToJobCardsModel = (jobs: GetJobsResponse): JobCardProps[] => {
  return (jobs?.data ?? []).map((job)=> ({
    title: job.title,
    subTitle: job.company,
    tags: job.skills,
    companyIcon: job.company_logo,
    applicationUrl: job.job_link
  }))
}