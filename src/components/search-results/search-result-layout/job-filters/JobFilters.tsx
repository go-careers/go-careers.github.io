import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useGetJobsFilterOptionQuery } from "../../../../../redux/features/queries/Job_APIS";
import { updateFilters } from "../../../../../redux/features/slices/filters/JobFilterSlices";
import ExperienceLevel from "./ExperienceLevel";

export default function JobFilters() {
  const { data: filterData } = useGetJobsFilterOptionQuery({});
  const [filter, setFilters] = useState("");

  const jobTypeOptions = filterData?.data?.job_type?.map(
    (jobType: unknown) => ({
      label: jobType, // Assigning 'jobType' as the label.
      value: jobType, // Assigning 'jobType' as the value.
    })
  );
  const jobTypes = jobTypeOptions?.map(
    (item: { label: unknown }) => item.label
  );

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(updateFilters({ job_type: filter }));
  }, [filter, dispatch]);
  return (
    <div className='md:px-16 px-10 pb-12'>
      {/*begin: Job filter area */}
      <div>
        <h2 className='text-[#030303] text-xl font-medium leading-[30px] mb-3'>
          Job Filters
        </h2>
        {jobTypes?.map((jobType: string, i: number) => (
          <div key={i}>
            <div className='flex items-center gap-x-3'>
              <div className='relative flex cursor-pointer items-center p-1 rounded-md'>
                <input
                  id={jobType}
                  type='checkbox'
                  name='softwareEngineer'
                  onClick={() => {
                    if (filter === jobType) {
                      // If the filter is already set, remove it
                      setFilters("");
                    } else {
                      // Otherwise, set the filter
                      setFilters(jobType);
                    }
                  }}
                  className='peer cursor-pointer appearance-none relative h-5 w-5 bg-transparent  border border-[#4869d7] transition-all checked:border-[#4869d7] checked:bg-transparent rounded-md'
                />
                <div className='pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#4869d7] opacity-0 transition-opacity peer-checked:opacity-100'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-3.5 w-3.5'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                    stroke='currentColor'
                    strokeWidth='1'>
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'></path>
                  </svg>
                </div>
              </div>
              <label
                className='text-[#030303] text-sm font-light leading-[22px]'
                htmlFor={jobType}>
                {jobType}
              </label>
            </div>
          </div>
        ))}
      </div>
      {/*end: Job filter area */}

      {/*end: Company rating area */}

      {/*begin: Experience level area */}
      <ExperienceLevel />
      {/*end: Experience level area */}
    </div>
  );
}
