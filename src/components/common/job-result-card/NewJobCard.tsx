/* eslint-disable no-unsafe-optional-chaining */
import moment from "moment";
import { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { FaBriefcase, FaClock } from "react-icons/fa";
import { MdLocationOn } from "react-icons/md";
import { getYOEText } from "../../../../redux/features/queries/Job_APIS";
import placeholder from "../../../assets/placeholder.jpg";

interface JobData {
    company: string;
    company_logo: string;
    counter: number;
    created_at: string;
    emp_type: string;
    exp_type: string;
    id: string;
    industry: string;
    is_open: boolean;
    job_link: string;
    job_location: string;
    job_platform: string;
    job_type: string;
    location_id: string;
    max_exp: number;
    min_exp: number;
    platform_job_id: string;
    posted_at: string;
    skills: string[];
    tags: string[];
    title: string;
    updated_at: string;
}

interface JobCardProps {
    jobData: JobData;
}

const NewJobCard: React.FC<JobCardProps> = ({ jobData }) => {
    const [showAllSkills, setShowAllSkills] = useState(false);
    const [marqueeActive, setMarqueeActive] = useState(false);
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [screenWidth, setScreenWidth] = useState<boolean>();
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 640) {
                setScreenWidth(false);
            } else {
                setScreenWidth(true);
            }
        };

        window.addEventListener("resize", handleResize);

        // Cleanup function to remove the event listener when the component unmounts
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const toggleSkillsVisibility = () => {
        setShowAllSkills(!showAllSkills);
        setTooltipVisible(false);
    };

    const handleMouseEnter = () => {
        setTooltipVisible(true);
    };

    const handleMouseLeave = () => {
        setTooltipVisible(false);
    };

    const handleCardClick = () => {
        setMarqueeActive(!marqueeActive);
    };

    const handleCardClickLeave = () => {
        setMarqueeActive(false);
    };

    return (
        // New Version Card
        <div className="h-fit bg-white shadow-[0px_2px_10px_rgba(3,3,3,0.1)] rounded-3xl mt-6">
            <div className="grid grid-cols-4 items-center gap-x-3 smd:gap-x-4 md-gap-x-8 px-1 py-2 smd:px-2 md:px-3 md:py-3">
                {/* left part */}
                <div className="w-[50px] sm:w-[70px] mt-2 smd:mt-0 smd:w-[100px] md:w-[120px] mx-auto">
                    <img
                        src={jobData?.company_logo || placeholder}
                        className="w-full object-cover rounded-3xl  smd:rounded-3xl"
                        alt="Company Logo"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = placeholder;
                        }}
                    />
                </div>

                {/* Mid Part */}
                <div className="col-span-3 jobCard:col-span-2">
                    <div>
                        <div
                            className="relative"
                            onClick={handleCardClick}
                            onMouseLeave={handleCardClickLeave}
                        >
                            <h1 className="w-full whitespace-nowrap overflow-hidden text-ellipsis text-[#030303] text-xs sm:text-sm smd:text-base md:text-lg lg:text-xl font-semibold smd:font-medium leading-[14px] sm:leading-[16px]  !md:leading-[25px]">
                                {marqueeActive && screenWidth ? (
                                    <Marquee speed={40}>
                                        {jobData?.title}
                                    </Marquee>
                                ) : (
                                    jobData?.title
                                )}
                            </h1>
                        </div>

                        <p className="text-[#030303] text-xs sm:text-sm leading-[16px]  text-ellipsis overflow-hidden">
                            {jobData?.company}
                        </p>
                    </div>

                    <div className="mt-2 md:mt-4">
                        <div className="text-[#030303] text-xs sm:text-sm font-medium leading-[16px] sm:leading-[18px] smd:leading-[22px] flex items-center gap-x-1">
                            <MdLocationOn />
                            {jobData?.job_location}
                        </div>
                        <small className="text-[#030303] text-xs sm:text-sm font-light leading-[16px] sm:leading-[18px] smd:leading-[22px]">
                            {jobData?.job_type}
                        </small>

                        <small className="flex jobCard:hidden items-center gap-x-2 text-[#030303] my-1">
                            {" "}
                            <FaBriefcase />
                            <span className="text-xs smd:text-sm md:text-[14px] font-medium">
                                {getYOEText(jobData?.min_exp, jobData?.max_exp)}
                            </span>
                        </small>
                    </div>

                    <div className="flex job_posted_at:hidden gap-x-1 items-center">
                        <FaClock />
                        <small>
                            <span className="text-xs uppercase">
                                {/* {moment(jobData?.posted_at).format("lll")} */}
                                posted{" "}
                                {moment(jobData?.posted_at)
                                    .startOf("hour")
                                    .fromNow()}
                            </span>
                        </small>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 mt-2">
                        {(showAllSkills
                            ? jobData?.skills
                            : jobData?.skills?.slice(0, 2)
                        ).map((skill, i) => (
                            <span
                                key={i}
                                className="flex items-center border box-border bg-white text-gray-800 text-[10px] smd:text-[12px] py-1 px-2 rounded-2xl border-solid border-gray-800 font-normal hover:cursor-pointer hover:text-black hover:scale-[1.02] transition-all ease-in-out duration-200"
                            >
                                {skill &&
                                    (skill as string)
                                        ?.slice(0, 1)
                                        ?.toUpperCase() +
                                        (skill as string)?.slice(1)}
                            </span>
                        ))}

                        {jobData?.skills?.length > 2 &&
                            (showAllSkills ? (
                                <button
                                    onClick={toggleSkillsVisibility}
                                    className="text-[10px] smd:text-[12px] font-medium text-black hover:text-gray-600 "
                                >
                                    Show Less
                                </button>
                            ) : (
                                <div className="relative">
                                    <button
                                        onClick={toggleSkillsVisibility}
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                        className="text-[10px] smd:text-[12px] font-medium text-black hover:text-gray-600 "
                                    >
                                        More...
                                    </button>
                                    <div
                                        className={`tooltip ${
                                            tooltipVisible ? "visible" : ""
                                        }`}
                                    >
                                        {jobData?.skills
                                            .slice(2)
                                            .map((skill, index, array) => (
                                                <span key={index}>
                                                    {skill}
                                                    {index !==
                                                        array.length - 1 &&
                                                        ", "}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            ))}
                    </div>

                    <div className="">
                        <a
                            href={`#/job-info/${jobData?.id}`}
                            target="_blank"
                            className="cursor-pointer mt-2 min-w-[120px] smd:w-[80px] h-[32px] box-border bg-[#4869d7] hover:bg-[#5774d5] transition-all ease-in-out duration-200 text-white text-[10px] smd:text-xs md:text-sm flex jobCard:hidden items-center justify-center leading-[18px] px-2 py-0 rounded-3xl border-0 "
                        >
                            View Job
                        </a>
                    </div>
                </div>

                {/* right part */}
                <div className="h-full w-full hidden jobCard:flex flex-col justify-start jobCard:justify-between items-end">
                    <div className="flex items-center gap-x-2">
                        <FaBriefcase />
                        <span className="text-xs smd:text-sm md:text-[14px] font-medium">
                            {getYOEText(jobData?.min_exp, jobData?.max_exp)}
                        </span>
                    </div>

                    {/* bottom part */}
                    <div className="w-full flex flex-col items-end justify-center">
                        <div className="hidden job_posted_at:flex justify-center gap-x-1 items-center">
                            <FaClock />
                            <small>
                                <span className="text-xs whitespace-nowrap uppercase ml-1">
                                    {/* {moment(jobData?.posted_at).format("lll")} */}
                                    posted{" "}
                                    {moment(jobData?.posted_at)
                                        .startOf("hour")
                                        .fromNow()}
                                </span>
                            </small>
                        </div>

                        <a
                            href={`#/job-info/${jobData?.id}`}
                            className="hidden cursor-pointer mt-2 w-full min-w-[100px] max-w-[150px] h-[32px] box-border bg-[#4869d7] hover:bg-[#5774d5] transition-all ease-in-out duration-200 text-white text-sm jobCard:flex items-center justify-center leading-[18px] px-2 py-0 rounded-3xl border-0 "
                        >
                            View Job
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewJobCard;
