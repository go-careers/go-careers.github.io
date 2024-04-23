import { useGetAllJobsQuery } from "../../../redux/features/queries/Job_APIS";

interface Props {
    jobDetails: any;
    isLoading: boolean;
    isError: boolean;
}
interface JobData {
    title: string;
    job_location: string;
    job_type: string;
    exp_type: string;
    company: string;
    company_logo: string;
    counter: number;
    created_at: string;
    emp_type: string;
    id: string;
    industry: string;
    is_open: boolean;
    job_link: string;
    job_platform: string;
    location_id: string;
    max_exp: number;
    min_exp: number;
    platform_job_id: string;
    posted_at: string;
    skills: string[];
    tags: string[];
    updated_at: string;
}

const SimilarJobs = ({ jobDetails, isLoading, isError }: Props) => {
    const { data: allJobs } = useGetAllJobsQuery({
        page_no: 1,
        page_size: 10,
        job_filter: {
            job_type: jobDetails?.data?.job_type,
            yoe: jobDetails?.data?.min_exp,
        },
        is_simillar_job: true,
    }) as unknown as {
        data: any;
    };

    const similarJobsList = allJobs?.data?.jobs?.filter(
        (job: any) =>
            job?.job_type === jobDetails?.data?.job_type &&
            job?.company !== jobDetails?.data?.company
    );

    return (
        <div className=" w-full lg:w-[230px] h-fit rounded-lg lg:border p-2">
            <h2 className="text-lg font-semibold mb-3 ml-1">Similar Jobs</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:flex flex-col gap-3 ">
                {similarJobsList?.slice(0, 6).map((job: JobData, i: number) => (
                    <div
                        key={i}
                        className=" hover:bg-gray-100 transition-all duration-200 ease-in-out p-2 rounded-lg"
                    >
                        <a href={`#/job-info/${job.id}`}>
                            <div className="flex items-center gap-2">
                                <img
                                    className="object-cover rounded-full size-9"
                                    src={job.company_logo}
                                    alt="Company Logo"
                                />
                                <div className="text-xs">
                                    <h3 className=" font-medium">
                                        {job?.title}
                                    </h3>
                                    <p className=" text-gray-500">
                                        {job?.company}
                                    </p>
                                    <p className=" text-gray-500">
                                        {job?.job_type}
                                    </p>
                                </div>
                            </div>
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SimilarJobs;
