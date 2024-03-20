import { API_ENDPOINTS, API_URL } from '../configs/ApiConfigs'

interface GetJobsRequest {
  job_filter?: {
    experience_type?: string
    location_ids?: string[]
    job_type?: string
  },
  page_no?: number,
  page_size?: number
}

interface Job {
  title: string
  id: string
  location: string
  job_type: string
  company: string
  skills: string[]
  job_link: string
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

export interface Location {
  city: string,
  country: string,
  counter: number,
  id: string,
  state: string
}

export interface GetLocationsResponse {
  data: Location[]
}


export const getAllLocations = async (): Promise<GetLocationsResponse> => {
  const response = await fetch(`${API_URL}/${API_ENDPOINTS.GET_LOCATIONS}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return response.json()
}

export interface RecordJobAnalyticsRequest {
  job_id: string
}

export interface RecordJobAnalyticsResponse {

}

export const recordJobAnalytics = async (request: RecordJobAnalyticsRequest): Promise<RecordJobAnalyticsResponse> => {
  const response = await fetch(`${API_URL}/${API_ENDPOINTS.RECORD_JOB_ANALYTICS}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })

  return response.json()
}