import { apiSlice } from "../apiSlice";

export const { injectEndpoints } = apiSlice;

// Define types for request payloads
interface JobFilterRequest {
  data: unknown;
  page_no: number;
  page_size: number;
  job_filter: {
    location_ids: string[];
    job_type: string;
    experience_type: string;
    skills: string[];
    yoe: number;
    posted_in_days?: number;
  };
}

export const getYOEText = (minExp: number, maxExp: number) => {
  if (minExp === maxExp) {
    return `${minExp}+ Years`;
  }
  return `${minExp}-${maxExp} Years`
}

export const Job_API = injectEndpoints({
  endpoints: (builder) => ({
    /* Get All Jobs API ENDPOINT */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAllJobs: builder.query<JobFilterRequest, any>({
      query: (data) => ({
        url: "/v2/jobs",
        method: "POST",
        body: data,
      }),
    }),
    getJobsDetails: builder.query({
      query: (data) => ({
        url: "/job-info",
        method: "POST",
        body: data,
      }),
    }),
    /* Get All Jobs Location API ENDPOINT */
    getAllJobLocation: builder.query({
      query: () => ({
        url: "/get-all-location",
        method: "GET",
      }),
    }),
    /* Get All filters API ENDPOINT */
    getJobsFilterOption: builder.query({
      query: () => ({
        url: "/jobs-filter-options",
        method: "GET",
      }),
    }),
    /* Dump Job Analytics API ENDPOINT */
    callJobAnalytics: builder.query({
      query: (data) => ({
        url: "/job-analytics",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

// Destructure the generated hooks for ease of use
export const {
  useGetAllJobsQuery,
  useGetJobsDetailsQuery,
  useGetAllJobLocationQuery,
  useGetJobsFilterOptionQuery,
  useCallJobAnalyticsQuery,
} = Job_API;
