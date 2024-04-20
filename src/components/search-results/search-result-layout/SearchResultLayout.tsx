import { useState } from "react";
import { IoFilterSharp } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import AdvanceSearch from "./advance-search/AdvanceSearch";
import JobResultList from "./job-result-list/JobResultList";

export default function SearchResultLayout() {
  const [show, setShow] = useState(false);
  const handleToggle = () => {
    setShow(!show);
  };
  return (
    <div className='flex flex-col xlg:flex-row relative'>
      {/* Left Side: Advance Search & Job Filter */}
      <aside
        className={`sidebar_search_result ${
          show ? "left-0 !w-[300px] jobCard:!w-[380px]" : "-left-[100%]"
        } xl:block min-h-screen fixed ease-in-out duration-300 xl:left-[0] z-10 xl:z-0 top-0 bottom-0 overflow-y-auto`}>
        <div className='mt-10 xl:mt-32 relative'>
          <button
            className='absolute right-5 block xl:hidden'
            onClick={() => setShow(false)}>
            <RxCross2 />
          </button>
          <AdvanceSearch setShow={setShow} />
          {/*  <JobFilters /> */}
        </div>
      </aside>
      {/* Right Side: Search Results */}
      <div className='mt-32 xl:mt-32 xlg:mt-32 w-full md:px-16 px-3 warper_content'>
        <div className='flex justify-between items-center'>
          <button
            onClick={handleToggle}
            className='border-0 xl:hidden text-base flex items-center gap-x-2'>
            <IoFilterSharp />
            Filter
          </button>
          <div>
            <h2 className='text-[#030303] hidden md:block text-2xl font-semibold leading-9'>
              Available jobs
            </h2>
          </div>
        </div>
        <JobResultList />
      </div>
    </div>
  );
}
