import { IoHome } from "react-icons/io5";
import { MdKeyboardArrowRight } from "react-icons/md";
import { Link } from "react-router-dom";

interface Props {
    jobDetails: any;
}

const Breadcrumb = ({ jobDetails }: Props) => {
    return (
        <div className=" hidden sm:flex mb-3" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3 p-4">
                <li className="inline-flex items-center ">
                    <Link
                        to="/"
                        className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 "
                    >
                        <IoHome className="mr-2 w-4 h-4" />
                        Home
                    </Link>
                </li>
                <li>
                    <div className="flex items-center">
                        <MdKeyboardArrowRight />
                        <Link
                            to="#"
                            className="ml-1 text-sm font-medium text-gray-700 hover:text-gray-900 md:ml-2 "
                        >
                            Job Info
                        </Link>
                    </div>
                </li>
                <li aria-current="page">
                    <div className="flex items-center">
                        <MdKeyboardArrowRight />
                        <span className="ml-1 text-sm font-medium text-gray-700 md:ml-2 ">
                            {jobDetails?.data?.title?.length > 25
                                ? `${jobDetails?.data?.title.slice(0, 25)}...`
                                : jobDetails?.data?.title}
                        </span>
                    </div>
                </li>
            </ol>
        </div>
    );
};

export default Breadcrumb;
