import { useParams } from "react-router-dom";
import { useGetJobsDetailsQuery } from "../../redux/features/queries/Job_APIS";
import Footer from "../components/common/footer/Footer";
import JobInfo from "../components/job-info-details/JobInfoDetails";
import PageTitle from "../components/page-title/PageTitle";
import Navbar from "../components/search-results/navbar/Navbar";

export default function JobDetails() {
  const { jobId } = useParams();

  const { data: jobDetails, isLoading } = useGetJobsDetailsQuery({
    job_id: jobId,
  });

  return (
    <>
      <PageTitle
        title={`${isLoading ? "Loading..." : jobDetails?.data?.title}`}
      />
      <Navbar />

      <div className='overflow-hidden'>
        <JobInfo />
      </div>

      <Footer />
    </>
  );
}
