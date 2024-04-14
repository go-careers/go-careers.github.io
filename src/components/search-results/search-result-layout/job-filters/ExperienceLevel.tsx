/* eslint-disable @typescript-eslint/no-explicit-any */
import { useDispatch, useSelector } from "react-redux";
import { useGetJobsFilterOptionQuery } from "../../../../../redux/features/queries/Job_APIS";
import { updateFilters } from "../../../../../redux/features/slices/filters/JobFilterSlices";
import { RootState } from "../../../../../redux/store";
export default function ExperienceLevel() {
  const { data: filterData } = useGetJobsFilterOptionQuery({});
  const dispatch = useDispatch();
  const { exp_type } = useSelector((state: RootState) => state.filters);

  const handleFilterChange = (type: string) => {
    dispatch(updateFilters({ exp_type: type }));
  };

  // Extracting selected experience level type
  const jobExperienceOptions = filterData?.data?.exp_type?.map(
    (experienceType: unknown) => ({
      label: experienceType, // Assigning 'experienceType' as the label.
      value: experienceType, // Assigning 'experienceType' as the value.
    })
  );
  const experienceData = jobExperienceOptions?.map(
    (item: { label: unknown }) => item.label
  );

  return (
    <div className='mt-4'>
      <h2 className='text-[#030303] text-xl font-medium leading-[30px] mt-[18px] mb-3'>
        Experience level
      </h2>

      <div className='flex items-center flex-wrap gap-y-2 gap-x-1'>
        {experienceData?.map((experience: any, i: number) => (
          <div key={i}>
            <button
              onClick={() => handleFilterChange(experience)}
              className={`flex items-center border box-border bg-white text-[#030303] text-[12px] leading-[18px] py-0 px-2 rounded-3xl border-solid border-[#030303] font-normal gap-x-1 ${
                exp_type === experience ? "active_level" : ""
              }`}>
              <svg
                className={`icon !text-[10px] !w-[12px] ${
                  exp_type === experience ? "activeIcon" : ""
                }`}
                viewBox='0 0 512 512'>
                <path d='M320 336c0 8.844-7.156 16-16 16h-96C199.2 352 192 344.8 192 336V288H0v144C0 457.6 22.41 480 48 480h416c25.59 0 48-22.41 48-48V288h-192V336zM464 96H384V48C384 22.41 361.6 0 336 0h-160C150.4 0 128 22.41 128 48V96H48C22.41 96 0 118.4 0 144V256h512V144C512 118.4 489.6 96 464 96zM336 96h-160V48h160V96z'></path>
              </svg>
              {experience}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
