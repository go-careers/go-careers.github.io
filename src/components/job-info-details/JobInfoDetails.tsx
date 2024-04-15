/* eslint-disable no-unsafe-optional-chaining */
import moment from "moment";
import React from "react";
import { BsPersonWorkspace } from "react-icons/bs";
import { FaBriefcase, FaClock, FaUserTie } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { GiGraduateCap } from "react-icons/gi";
import { GoDotFill } from "react-icons/go";
import { IoHome } from "react-icons/io5";
import { MdKeyboardArrowRight } from "react-icons/md";
import { Link, useParams } from "react-router-dom";
import { useGetJobsDetailsQuery, getYOEText } from "../../../redux/features/queries/Job_APIS";

const JobInfo: React.FC = () => {
  const { jobId } = useParams();

  // Fetch job details using the job ID
  const {
    data: jobDetails,
    isLoading,
    isError,
  } = useGetJobsDetailsQuery({
    job_id: jobId,
  });

  // Loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Error state
  if (isError) {
    return <div>Error fetching job details</div>;
  }

  // Data is not available yet
  if (!jobDetails) {
    return <div>No data available</div>;
  }

  return (
    <>
      <div className='mt-[120px] container max-w-container'>
        <nav className='hidden sm:flex mb-4' aria-label='Breadcrumb'>
          <ol className='inline-flex items-center space-x-1 md:space-x-3 shadow p-4 rounded'>
            <li className='inline-flex items-center '>
              <Link
                to='/'
                className='inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 '>
                <IoHome className='mr-2 w-4 h-4' />
                Home
              </Link>
            </li>
            <li>
              <div className='flex items-center'>
                <MdKeyboardArrowRight />
                <Link
                  to='#'
                  className='ml-1 text-sm font-medium text-gray-700 hover:text-gray-900 md:ml-2 '>
                  Job Info
                </Link>
              </div>
            </li>
            <li aria-current='page'>
              <div className='flex items-center'>
                <MdKeyboardArrowRight />
                <span className='ml-1 text-sm font-medium text-gray-700 md:ml-2 '>
                  {jobDetails?.data?.title?.length > 25
                    ? `${jobDetails?.data?.title.slice(0, 25)}...`
                    : jobDetails?.data?.title}
                </span>
              </div>
            </li>
          </ol>
        </nav>
        {/* Upper Part */}
        <div className='grid md:align-top md:justify-normal md:grid-cols-5'>
          {/* Company Image and Job Details */}
          <div className='flex flex-col md:flex-row md:col-span-4 gap-5 md:gap-10 md:mb-10'>
            {/* Company Img */}
            <div className='m-auto md:m-0'>
              <img
                className='max-w-28 object-cover rounded-3xl md:rounded-3xl p-2 border border-1'
                src={jobDetails?.data?.company_logo}
                alt='logo'
              />
            </div>

            {/* Job Details */}
            <div>
              <div className='grid gap-2 items-center justify-center md:justify-start'>
                <div className='text-center md:text-left'>
                  {/* Job Title */}
                  <h1 className='text-[#030303] text-base md:text-lg lg:text-xl font-semibold smd:font-medium leading-[20px] sm:leading-[16px] !md:leading-[25px] mb-2'>
                    {jobDetails?.data?.title}
                  </h1>

                  {/* Company Name */}
                  <p className='text-[#030303] text-sm leading-[16px]'>
                    {jobDetails?.data?.company}
                  </p>
                </div>

                <div className='grid mx-auto sm:m-0 grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6 py-6 md:grid-cols-2'>
                  {/* Job Location */}
                  <h4 className='text-[#030303] text-sm font-medium leading-[16px] sm:leading-[18px] smd:leading-[22px] flex items-center gap-x-2'>
                    <FaLocationDot />
                    {jobDetails?.data?.job_location}
                  </h4>

                  {/* Job Period */}
                  <div>
                    <h4 className='text-[#030303] text-sm font-medium leading-[16px] sm:leading-[18px] smd:leading-[22px] flex items-center gap-x-2'>
                      <FaUserTie />
                      {jobDetails?.data?.job_type}
                    </h4>
                  </div>

                  {/* Experience Period */}
                  <div>
                    <small className='flex items-center gap-x-2 text-[#030303]'>
                      <FaBriefcase />
                      <span className='smd:text-sm md:text-[14px] font-medium'>
                        {getYOEText(jobDetails?.data?.min_exp, jobDetails?.data?.max_exp)}
                      </span>
                    </small>
                  </div>

                  {/* Job Platform Type */}
                  <div>
                    <h4 className='text-[#030303] text-sm font-medium leading-[16px] sm:leading-[18px] smd:leading-[22px] flex items-center gap-x-2'>
                      <BsPersonWorkspace />
                      {jobDetails?.data?.job_platform}
                    </h4>
                  </div>

                  {/* Employ Type */}
                  <div>
                    <h4 className='text-[#030303] text-sm font-medium leading-[16px] sm:leading-[18px] smd:leading-[22px] flex items-center gap-x-2'>
                      <GiGraduateCap />
                      {jobDetails?.data?.emp_type}
                    </h4>
                  </div>

                  {/* Posted At */}
                  <div className='flex gap-x-1 items-center'>
                    <FaClock />
                    <h4 className='text-[#030303] text-sm font-medium leading-[16px] sm:leading-[18px] smd:leading-[22px] flex items-center gap-x-1 uppercase'>
                      posted{" "}
                      {moment(jobDetails?.data?.posted_at)
                        .startOf("hour")
                        .fromNow()}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Apply Now Btn */}
          <div className='m-auto md:m-0 flex justify-end md:col-span-1'>
            <a
              href={jobDetails?.data?.job_link}
              target='_blank'
              className='cursor-pointer w-100 min-w-[206px] md:min-w-[150px] md:max-w-[150px] h-[41px] box-border bg-[#4869d7] text-white text-sm flex items-center justify-center leading-[18px] px-2 py-0 rounded-3xl border-0 md:mt-0 md:mb-0 mb-5'>
              Apply Now
            </a>
          </div>
        </div>

        {/* About Company */}
        <div>
          {jobDetails?.data?.description?.about_company?.length > 0 && (
            <h1 className='border box-border text-[#030303] text-[10px] border-t-0 border-l-0 border-r-0 text-sm sm:text-base md:text-lg font-bold mb-4 pb-2'>
              About Company
            </h1>
          )}

          <div className='mb-5 text-sm sm:text-base md:text-lg'>
            <span>{jobDetails?.data?.description?.about_company.length > 0 &&
              jobDetails?.data?.description?.about_company}</span>
          </div>
        </div>

        {/* Qualifications */}
        <div>
          {jobDetails?.data?.description?.qualifications?.length > 0 && (
            <h1 className='border box-border text-[#030303] text-[10px] border-t-0 border-l-0 border-r-0 text-sm sm:text-base md:text-lg font-bold mb-4 pb-2'>
              Qualifications
            </h1>
          )}

          <div className='mb-5'>
            {(jobDetails?.data?.description?.qualifications || []).length >
            0 ? (
              (jobDetails?.data?.description?.qualifications || []).map(
                (
                  qualification:
                    | string
                    | number
                    | boolean
                    | React.ReactElement<
                        unknown,
                        string | React.JSXElementConstructor<unknown>
                      >
                    | Iterable<React.ReactNode>
                    | React.ReactPortal
                    | null
                    | undefined,
                  index: React.Key | null | undefined
                ) => (
                  <li key={index} className='flex relative'>
                    <GoDotFill className='absolute top-[3px] sm:top-[4px] md:top-[7px]' />
                    <span className='ml-6 md:ml-7 text-sm sm:text-base md:text-lg'>
                      {qualification}
                    </span>
                  </li>
                )
              )
            ) : (
              <></>
            )}
          </div>
        </div>

        {/* Responsibilities */}
        <div>
          {jobDetails?.data?.description?.responsibilities.length > 0 && (
            <h1 className='border box-border text-[#030303] text-[10px] border-t-0 border-l-0 border-r-0 text-sm sm:text-base md:text-lg font-bold mb-4 pb-2'>
              Responsibilities
            </h1>
          )}

          <div className='mb-5'>
            {(jobDetails?.data?.description?.responsibilities || []).length >
            0 ? (
              (jobDetails?.data?.description?.responsibilities || []).map(
                (
                  responsibility:
                    | string
                    | number
                    | boolean
                    | React.ReactElement<
                        unknown,
                        string | React.JSXElementConstructor<unknown>
                      >
                    | Iterable<React.ReactNode>
                    | React.ReactPortal
                    | null
                    | undefined,
                  index: React.Key | null | undefined
                ) => (
                  <li key={index} className='flex relative'>
                    <GoDotFill className='absolute top-[3px] sm:top-[4px] md:top-[7px]' />
                    <span className='ml-6 md:ml-7 text-sm sm:text-base md:text-lg'>
                      {responsibility}
                    </span>
                  </li>
                )
              )
            ) : (
              <></>
            )}
          </div>
        </div>

        {/* skills */}
        <div>
          {jobDetails?.data?.skills?.length > 0 && (
            <h1 className='border box-border text-[#030303] text-[10px] border-t-0 border-l-0 border-r-0 text-sm sm:text-base md:text-lg font-bold mb-4 pb-2'>
              Skills
            </h1>
          )}
          <div>
            {(jobDetails?.data?.skills || []).length > 0 ? (
              (jobDetails?.data?.skills || []).map(
                (
                  skill:
                    | string
                    | number
                    | boolean
                    | React.ReactElement<
                        unknown,
                        string | React.JSXElementConstructor<unknown>
                      >
                    | Iterable<React.ReactNode>
                    | React.ReactPortal
                    | null
                    | undefined,
                  index: React.Key | null | undefined
                ) => (
                  <li key={index} className='flex relative'>
                    <GoDotFill className='absolute top-[3px] sm:top-[4px] md:top-[7px]' />
                    <span className='ml-6 md:ml-7 uppercase text-sm sm:text-base md:text-lg'>
                      {skill}
                    </span>
                  </li>
                )
              )
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default JobInfo;
