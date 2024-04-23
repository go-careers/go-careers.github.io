/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useGetAllJobsQuery } from "../../../../../redux/features/queries/Job_APIS";
import Loader from "../../../Loader/Loader";
import NewJobCard from "../../../common/job-result-card/NewJobCard";
// import JobCard from "../../../common/job-result-card/JobCard";

interface JobResult {
    data: any;
    total_pages: number;
    isError: boolean;
    // other fields if available in the API response
}

interface JobData {
    title: string;
    job_location: string;
    job_type: string;
    exp_type: string;
    // Add other properties as needed
}
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

const JobResultList: React.FC = () => {
    const [showPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const {
        title,
        job_type: jobType,
        job_location: jobLocation,
        selectedSkills,
        posted_in_days: postedInDays,
        yoe,
        emp_type,
    } = useSelector((state: any) => state.filters);

    const {
        data: jobResult,
        isError,
        isLoading: loadingState,
    } = useGetAllJobsQuery({
        page_no: currentPage,
        page_size: showPerPage,
        job_filter: {
            title: title,
            location_ids: jobLocation,
            job_type: jobType,
            skills: selectedSkills,
            posted_in_days: postedInDays,
            emp_type,
            yoe,
        },
    }) as unknown as { data: JobResult; isError: boolean; isLoading: boolean }; // Add isError property;
    const totalPages = jobResult?.data?.total_pages || 0;

    // Set to first page if current page is greater than total pages.
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    const goToPage = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prevPage) => prevPage + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prevPage) => prevPage - 1);
        }
    };

    //decide what to render
    let content;
    if (loadingState)
        content = (
            <div>
                <Loader />
            </div>
        );
    if (!loadingState && !isError) {
        content = (
            <>
                <>
                    {jobResult?.data?.jobs?.length > 0 ? (
                        jobResult?.data?.jobs?.map(
                            (jobData: JobData, index: number) => (
                                <NewJobCard key={index} jobData={jobData} />
                            )
                        )
                    ) : (
                        <h2 className="mt-5 text-2xl my-12 font-semibold text-red-500">
                            No Data Found
                        </h2>
                    )}
                </>
            </>
        );
    }

    return (
        <div className="w-full overflow-hidden">
            {/* job list card */}
            <div className="grid grid-cols-1">{content}</div>
            {/* pagination */}
            {jobResult?.data?.total_pages !== 0 && (
                <div>
                    <div className="flex items-center justify-center  px-4 py-3 sm:px-6 my-20">
                        <div>
                            <nav
                                className="isolate inline-flex -space-x-px rounded-md"
                                aria-label="Pagination"
                            >
                                <button
                                    className="px-4 py-2 text-sm font-semibold text-gray-900"
                                    onClick={goToPrevPage}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                                {[...Array(totalPages)].map((_, index) => {
                                    // Determine which page numbers to display
                                    const displayPage = index + 1;
                                    const startPage = currentPage - 2;
                                    const endPage = currentPage + 2;

                                    if (
                                        displayPage === 1 ||
                                        displayPage === totalPages ||
                                        (displayPage >= startPage &&
                                            displayPage <= endPage)
                                    ) {
                                        return (
                                            <button
                                                key={index}
                                                onClick={() =>
                                                    goToPage(displayPage)
                                                }
                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900  ${
                                                    currentPage === index + 1
                                                        ? "bg-[#4869d7] text-white rounded"
                                                        : ""
                                                }`}
                                                disabled={
                                                    currentPage === displayPage
                                                }
                                            >
                                                {displayPage}
                                            </button>
                                        );
                                    } else if (
                                        displayPage === startPage - 1 ||
                                        displayPage === endPage + 1
                                    ) {
                                        return (
                                            <span
                                                key={index}
                                                className="mt-1 text-xl"
                                            >
                                                ....
                                            </span>
                                        );
                                    }
                                    return null;
                                })}
                                <button
                                    className="px-4 py-2 text-sm font-semibold text-gray-900"
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobResultList;
