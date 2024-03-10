import { API_ENDPOINTS, API_URL } from '../configs/ApiConfigs'

interface GetJobsRequest {
  experience_type?: string
  location?: string
  job_type?: string
}

interface Job {
  title: string
  location: string
  job_type: string
  company: string
  skills: string[]
  job_link: string,
  company_logo: string
}

export interface GetJobsResponse {
  data: Job[],
  status: string
}

export const getJobs = async (request: GetJobsRequest): Promise<GetJobsResponse> => {
  const response = await fetch(`${API_URL}/${API_ENDPOINTS.GET_JOBS}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })

  return response.json()
}