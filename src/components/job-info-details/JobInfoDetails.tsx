/* eslint-disable no-unsafe-optional-chaining */
import moment from "moment";
import React from "react";
import { BsPersonWorkspace } from "react-icons/bs";
import { FaBriefcase, FaClock, FaUserTie } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { GiGraduateCap } from "react-icons/gi";
import { GoDotFill } from "react-icons/go";
import {
    getYOEText,
    useCallJobAnalyticsQuery,
} from "../../../redux/features/queries/Job_APIS";
import placeholder from "../../assets/placeholder.jpg";

interface Props {
    jobId: string;
    jobDetails: any;
    isLoading: boolean;
    isError: boolean;
}

const JobInfo = ({ jobId, jobDetails, isLoading, isError }: Props) => {
    const {} = useCallJobAnalyticsQuery({
        job_id: jobId,
    });

    // Loading state
    if (isLoading) {
        return <div className="text-center mt-20">Loading...</div>;
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
        <div className="flex-1 p-3 rounded-lg lg:border w-full">
            {/* Key Points of Job*/}
            <div className="grid md:align-top md:justify-normal md:grid-cols-6 mb-6 md:m-0">
                {/* Company Image and Job Details */}
                <div className="flex flex-col md:flex-row md:col-span-4 gap-4 lg:gap-8 md:mb-10">
                    {/* Company Img Only visible in small screen with width < 976px*/}
                    <div className="m-auto md:m-0 lg:hidden">
                        <img
                            className="max-w-28 object-cover rounded-full p-2 border border-1"
                            src={jobDetails?.data?.company_logo || placeholder}
                            alt="Company Logo"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = placeholder;
                            }}
                        />
                    </div>
                    {/* Job Details */}
                    <div className="grid gap-2 items-center justify-center md:justify-start">
                        <div className="text-center md:text-left">
                            {/* Job Title */}
                            <h1 className="text-[#030303] text-base md:text-lg lg:text-xl font-semibold leading-[30px] mb-2">
                                {jobDetails?.data?.title}
                            </h1>

                            {/* Company Name */}
                            <p className="text-[#030303] text-sm leading-[16px]">
                                {jobDetails?.data?.company}
                            </p>
                        </div>

                        <div className="grid mx-auto sm:m-0 grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 py-6 content-start w-full">
                            {/* Job Location */}
                            <span className="text-[#030303] text-sm font-medium flex items-center gap-x-2">
                                <FaLocationDot />
                                {jobDetails?.data?.job_location}
                            </span>

                            {/* Job Period */}
                            <span className="text-[#030303] text-sm font-medium flex items-center gap-x-2">
                                <FaUserTie />
                                {jobDetails?.data?.job_type}
                            </span>

                            {/* Experience Period */}
                            <span className="flex items-center text-sm font-medium gap-x-2 text-[#030303]">
                                <FaBriefcase />
                                {getYOEText(
                                    jobDetails?.data?.min_exp,
                                    jobDetails?.data?.max_exp
                                )}
                            </span>

                            {/* Job Platform Type */}
                            <span className="text-[#030303] text-sm font-medium flex items-center gap-x-2">
                                <BsPersonWorkspace />
                                {jobDetails?.data?.job_platform}
                            </span>

                            {/* Employ Type */}
                            <span className="text-[#030303] text-sm font-medium flex items-center gap-x-2">
                                <GiGraduateCap />
                                {jobDetails?.data?.emp_type}
                            </span>

                            {/* Posted At */}
                            <span className="text-[#030303] text-sm font-medium flex items-center gap-x-2 uppercase">
                                <FaClock />
                                posted{" "}
                                {moment(jobDetails?.data?.posted_at)
                                    .startOf("hour")
                                    .fromNow()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Apply Now Btn */}
                <div className="flex min-w-fit justify-center md:justify-end items-center md:items-start md:col-span-2">
                    <a
                        href={jobDetails?.data?.job_link}
                        target="_blank"
                        className="cursor-pointer inline-flex bg-[#4869d7] hover:bg-[#5774d5] transition-all ease-in-out duration-200 text-white text-sm px-6 py-3 rounded-3xl border-0 whitespace-nowrap"
                    >
                        Apply Now
                    </a>
                </div>
            </div>

            {/* About Company */}
            {jobDetails?.data?.description?.about_company.length > 0 &&
                jobDetails?.data?.description?.about_company != '""' &&
                jobDetails?.data?.description?.about_company != "null" && (
                    <div>
                        <h3 className="border text-[#030303] text-[10px] border-t-0 border-l-0 border-r-0 text-sm sm:text-base md:text-lg font-bold mb-2 pb-1">
                            About Company
                        </h3>

                        <div className="mb-5 text-sm">
                            <span>
                                {jobDetails?.data?.description?.about_company}
                            </span>
                        </div>
                    </div>
                )}

            {/* Qualifications */}
            {jobDetails?.data?.description?.qualifications?.length > 0 && (
                <div>
                    <h3 className="border box-border text-[#030303] text-[10px] border-t-0 border-l-0 border-r-0 text-sm sm:text-base md:text-lg font-bold mb-2 pb-1">
                        Qualifications
                    </h3>

                    <div className="mb-5 ">
                        {(jobDetails?.data?.description?.qualifications || [])
                            .length > 0 ? (
                            (
                                jobDetails?.data?.description?.qualifications ||
                                []
                            ).map(
                                (
                                    qualification:
                                        | string
                                        | number
                                        | boolean
                                        | React.ReactElement<
                                              unknown,
                                              | string
                                              | React.JSXElementConstructor<unknown>
                                          >
                                        | Iterable<React.ReactNode>
                                        | React.ReactPortal
                                        | null
                                        | undefined,
                                    index: React.Key
                                ) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-3 relative"
                                    >
                                        <GoDotFill className="mt-1.5 size-2 -mr-1" />
                                        <div className="flex-1 text-sm ">
                                            {qualification}
                                        </div>
                                    </li>
                                )
                            )
                        ) : (
                            <></>
                        )}
                    </div>
                </div>
            )}

            {/* Responsibilities */}
            {jobDetails?.data?.description?.responsibilities.length > 0 && (
                <div>
                    <h3 className="border box-border text-[#030303] text-[10px] border-t-0 border-l-0 border-r-0 text-sm sm:text-base md:text-lg font-bold mb-2 pb-1">
                        Responsibilities
                    </h3>

                    <div className="mb-5">
                        {(jobDetails?.data?.description?.responsibilities || [])
                            .length > 0 &&
                            (
                                jobDetails?.data?.description
                                    ?.responsibilities || []
                            ).map(
                                (
                                    responsibility:
                                        | string
                                        | number
                                        | boolean
                                        | React.ReactElement<
                                              unknown,
                                              | string
                                              | React.JSXElementConstructor<unknown>
                                          >
                                        | Iterable<React.ReactNode>
                                        | React.ReactPortal
                                        | null
                                        | undefined,
                                    index: React.Key
                                ) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-3 relative"
                                    >
                                        <GoDotFill className="mt-1.5 size-2 -mr-1" />
                                        <div className="text-sm flex-1">
                                            {responsibility}
                                        </div>
                                    </li>
                                )
                            )}
                    </div>
                </div>
            )}

            {/* skills */}
            {jobDetails?.data?.skills.length > 0 && (
                <div>
                    <h3 className="border box-border text-[#030303] text-[10px] border-t-0 border-l-0 border-r-0 text-sm sm:text-base md:text-lg font-bold mb-2 pb-1">
                        Skills
                    </h3>

                    <div className="flex items-start gap-2 flex-wrap">
                        {(jobDetails?.data?.skills || []).map(
                            (
                                skill:
                                    | string
                                    | number
                                    | boolean
                                    | React.ReactElement<
                                          unknown,
                                          | string
                                          | React.JSXElementConstructor<unknown>
                                      >
                                    | Iterable<React.ReactNode>
                                    | React.ReactPortal
                                    | null
                                    | undefined,
                                i: React.Key
                            ) => (
                                <span
                                    key={i}
                                    className="flex items-center border box-border bg-white text-gray-800 text-[12px] py-1 px-2 rounded-2xl border-solid border-gray-800 font-normal hover:cursor-pointer hover:text-black hover:scale-[1.02] transition-all ease-in-out duration-200"
                                >
                                    {skill &&
                                        (skill as string)
                                            ?.slice(0, 1)
                                            ?.toUpperCase() +
                                            (skill as string)?.slice(1)}
                                </span>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobInfo;
