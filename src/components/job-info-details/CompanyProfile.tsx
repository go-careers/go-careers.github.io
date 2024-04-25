import placeholder from "../../assets/placeholder.jpg";
import { BiLinkExternal } from "react-icons/bi";
import { StarIcon } from "@heroicons/react/24/solid";

interface Props {
    jobDetails: any;
    isLoading: boolean;
    isError: boolean;
}

const CompanyProfile = ({ jobDetails, isLoading, isError }: Props) => {
    return (
        <div className="flex items-center flex-col gap-2 max-w-[400px] mx-auto lg:w-[220px] h-fit rounded-lg lg:border p-4 justify-center ">
            {/* Company logo */}
            <div className="flex items-center">
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
            {/* Company name */}
            <div className="text-lg font-semibold text-center">
                {jobDetails?.data?.company}
            </div>
            {/* Company location */}
            <div className="text-sm text-gray-500 text-center -mt-2">
                {jobDetails?.data?.job_location}
            </div>

            {/* Commented code is for company website and ratings which are not available in the API response at this time. */}
            
            {/* Company website */}
            {/* <div className="text-base text-gray-500 text-center hover:text-blue-700">
                <a
                    href={`https://www.${
                        jobDetails?.data?.company
                            ? jobDetails.data.company.replace(/\s/g, "")
                            : "google"
                    }.com`}
                    target="_blank"
                    rel="noreferrer"
                >
                    <BiLinkExternal />
                </a>
            </div> */}

            {/* Company Ratings */}
            {/* <div className="mt-1 w-full">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Overall:</span>
                    <div className="flex items-center gap-0.5">
                        <span className="text-xs">3</span>
                        <StarIcon className="text-yellow-400 size-5" />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                        Work-Life Balance:
                    </span>
                    <div className="flex items-center gap-0.5">
                        <span className="text-xs">3</span>
                        <StarIcon className="text-yellow-400 size-5" />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                        Salary and Benefits:
                    </span>
                    <div className="flex items-center gap-0.5">
                        <span className="text-xs">3</span>
                        <StarIcon className="text-yellow-400 size-5" />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                        Career Growth:
                    </span>
                    <div className="flex items-center gap-0.5">
                        <span className="text-xs">3</span>
                        <StarIcon className="text-yellow-400 size-5" />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                        Company Culture:
                    </span>
                    <div className="flex items-center gap-0.5">
                        <span className="text-xs">3</span>
                        <StarIcon className="text-yellow-400 size-5" />
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default CompanyProfile;
