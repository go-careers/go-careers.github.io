import { useParams } from "react-router-dom";
import { useGetJobsDetailsQuery } from "../../redux/features/queries/Job_APIS";
import Footer from "../components/common/footer/Footer";
import JobInfo from "../components/job-info-details/JobInfoDetails";
import PageTitle from "../components/page-title/PageTitle";
import Navbar from "../components/search-results/navbar/Navbar";
import Breadcrumb from "../components/common/breadcrumb/Breadcrumb";
import CompanyProfile from "../components/job-info-details/CompanyProfile";
import SimilarJobs from "../components/job-info-details/SimilarJobs";

export default function JobDetails() {
    const { jobId } = useParams();

    const {
        data: jobDetails,
        isLoading,
        isError,
    } = useGetJobsDetailsQuery({
        job_id: jobId,
    });

    return (
        <>
            <PageTitle
                title={`${isLoading ? "Loading..." : jobDetails?.data?.title}`}
            />
            <Navbar />
            <div className="mt-[90px] p-3 max-w-container mx-auto">
                {/* Breadcrumb */}
                <Breadcrumb jobDetails={jobDetails} />

                {/* Job Details ||  Company Overview || Similar Jobs*/}
                <div className="flex lg:flex-row flex-col items-start justify-between gap-3 w-full h-full relative">
                    {/* sticky company profile */}
                    <div className="lg:order-1 order-2 w-full lg:w-fit h-fit lg:sticky top-[105px]">
                        <CompanyProfile
                            jobDetails={jobDetails}
                            isLoading={isLoading}
                            isError={isError}
                        />
                    </div>
                    {/* JD Component*/}
                    <div className="order-1 lg:order-2 flex-1">
                        <JobInfo
                            jobId={jobId as string}
                            jobDetails={jobDetails}
                            isLoading={isLoading}
                            isError={isError}
                        />
                    </div>
                    {/* Similar Jobs */}
                    <div className="order-3 w-full lg:w-fit">
                        <SimilarJobs
                            jobDetails={jobDetails}
                            isLoading={isLoading}
                            isError={isError}
                        />
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}
