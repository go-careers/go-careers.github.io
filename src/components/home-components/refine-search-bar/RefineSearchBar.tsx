// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { useState } from "react";
// import { useDispatch } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import Select from "react-select";
// import {
//   useGetAllJobLocationQuery,
//   useGetJobsFilterOptionQuery,
// } from "../../../../redux/features/queries/Job_APIS";
// import { updateFilters } from "../../../../redux/features/slices/filters/JobFilterSlices";
// import searchImg from "../../../assets/home-page-assets/arrow-right.png";
// import settingImg from "../../../assets/home-page-assets/settings.png";
// import RefineSearchModal from "../../refine-search/RefineSearchModal";

// interface Option {
//   map(arg0: (skill: Option) => string): unknown;
//   label: string; // The display label for the option.
//   value: string; // The value associated with the option.
// }

// interface Location {
//   id: number; // Unique identifier for the location.
//   city: string; // The name of the city associated with the location.
// }

// interface RefineSearchBarProps {
//   isOpen: boolean; // Indicates whether the refine search bar is open or closed.
//   openRefineSearchModal: () => void; // Function to open the refine search modal when called.
//   onClose: () => void; // Function to close the refine search bar when called.
// }

// const RefineSearchBar: React.FC<RefineSearchBarProps> = ({
//   isOpen,
//   openRefineSearchModal,
//   onClose,
// }) => {
//   // Fetch job location data using useGetAllJobLocationQuery hook.
//   // Destructure the returned object to extract data, error, and loading state.
//   const { data: jobLocationsData } = useGetAllJobLocationQuery({});
//   const dispatch = useDispatch();

//   // Destructuring the result of the useGetJobsFilterOptionQuery() hook call:
//   const { data: filterData } = useGetJobsFilterOptionQuery({});

//   // Map over the data obtained from jobLocationsData if it exists.
//   const jobLocations = jobLocationsData?.data?.map((location: Location) => ({
//     label: location.city,
//     value: location.id,
//   }));

//   // Map over the 'exp_type' array obtained from filterData if it exists.
//   const jobExperienceOptions = filterData?.data?.exp_type?.map(
//     (experienceType: Option) => ({
//       label: experienceType,
//       value: experienceType,
//     })
//   );

//   // Map over the 'job_type' array obtained from filterData if it exists.
//   const jobTypeOptions = filterData?.data?.job_type?.map((jobType: Option) => ({
//     label: jobType,
//     value: jobType,
//   }));

//   // Map over the 'skills' array obtained from filterData if it exists.

//   const skillOptions = filterData?.data?.skills?.map((skillOption: Option) => ({
//     label: skillOption,
//     value: skillOption,
//   }));

//   // Initialize state variable 'formData' using the 'useState' hook.
//   const [formData, setFormData] = useState({
//     job_location: null as Option | null,
//     job_type: null as Option | null,
//     exp_type: null as Option | null,
//     selectedSkills: null as Option | null,
//   });

//   // Initialize state variable 'searchValue' using the 'useState' hook.
//   const [, setSearchValue] = useState({});

//   // The 'useNavigate' hook returns a navigation function that can be used to programmatically navigate to different routes.
//   const navigate = useNavigate();

//   // Event handler for updating the selected location option in the 'formData' state.
//   const handleLocationChange = (selectedOption: Option | null) => {
//     setFormData({ ...formData, job_location: selectedOption });
//   };

//   // Event handler for updating the selected job type option in the 'formData' state.
//   const handleJobTypeChange = (selectedOption: Option | null) => {
//     setFormData({ ...formData, job_type: selectedOption });
//   };

//   // Event handler for updating the selected experience level option in the 'formData' state.
//   const handleExperienceLevelChange = (selectedOption: Option | null) => {
//     setFormData({ ...formData, exp_type: selectedOption });
//   };

//   // Event handler for updating the selected skills option in the 'formData' state.
//   const handleSkillsChange = (selectedOption: Option | null) => {
//     setFormData({ ...formData, selectedSkills: selectedOption });
//   };

//   const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();

//     // Extracting selected location IDs
//     const locationIds = formData.job_location
//       ? formData.job_location.map((location: any) => location.value)
//       : [];

//     // Extracting selected job type
//     const jobType = formData.job_type ? formData.job_type.value : "";

//     // Extracting selected experience level type
//     const experienceType = formData.exp_type ? formData.exp_type.value : "";

//     // Extracting selected Skills type
//     const skills = formData.selectedSkills
//       ? formData?.selectedSkills?.map((skill: Option) => skill.value)
//       : [];

//     // Update formData with location_ids
//     const updatedFormData = {
//       ...formData,
//       job_location: locationIds,
//       job_type: jobType,
//       exp_type: experienceType,
//       selectedSkills: skills,
//     };

//     // Update searchValue with current form data including location_ids, job_type, and experience_type
//     setSearchValue(updatedFormData);
//     // Reset the form data
//     setFormData({
//       job_location: null,
//       job_type: null,
//       exp_type: null,
//       selectedSkills: null,
//     });

//     dispatch(updateFilters(updatedFormData));
//     navigate("/search-result");
//   };

//   return (
//     <div className='home-main-search-container'>
//       <div
//         className='absolute left-[50%] top-[5%] '
//         onClick={openRefineSearchModal}>
//         <img
//           className='w-[25px] cursor-pointer mx-auto hidden'
//           src={settingImg}
//           alt=''
//         />
//       </div>
//       <form
//         className='home-search-form-content pb-[1px] pt-[40px] xlg:pt-[13px]'
//         onSubmit={handleSubmit}>
//         <div className=''>
//           {/* Location input field */}
//           <div className=' w-full grid grid-cols-1 mt-[40px] mb-3 '>
//             <label className='home-search-label' htmlFor='grid-location'>
//               Location
//             </label>

//             <Select<Option>
//               styles={{
//                 control: (baseStyles, state) => ({
//                   ...baseStyles,
//                   borderColor: state.isFocused ? "grey" : "transparent",
//                 }),
//               }}
//               className='select-box home-search-select-field'
//               id='grid-location'
//               placeholder='Where do you want to work?'
//               isMulti
//               options={jobLocations}
//               value={formData.job_location}
//               onChange={handleLocationChange}
//             />
//           </div>

//           <div className='grid grid-cols-1 smd:grid-cols-2 w-full'>
//             {/* Job Type Select component */}
//             <div className='mb-3'>
//               <label className='home-search-label' htmlFor='grid-job-type'>
//                 Job Type
//               </label>
//               <Select<Option>
//                 styles={{
//                   control: (baseStyles, state) => ({
//                     ...baseStyles,
//                     borderColor: state.isFocused ? "grey" : "transparent",
//                   }),
//                 }}
//                 className='select-box home-search-select-field'
//                 id='grid-job-type'
//                 placeholder='select job type'
//                 options={jobTypeOptions}
//                 value={formData.job_type}
//                 onChange={handleJobTypeChange}
//               />
//             </div>

//             {/* Experience Level Select component */}
//             <div className=' mb-3'>
//               <label
//                 className='home-search-label'
//                 htmlFor='grid-experience-level'>
//                 Experience Level
//               </label>
//               <Select<Option>
//                 styles={{
//                   control: (baseStyles, state) => ({
//                     ...baseStyles,
//                     borderColor: state.isFocused ? "grey" : "transparent",
//                   }),
//                 }}
//                 className='home-search-select-field'
//                 id='grid-experience-level'
//                 placeholder='Choose'
//                 options={jobExperienceOptions}
//                 value={formData.exp_type}
//                 onChange={handleExperienceLevelChange}
//               />
//             </div>
//           </div>

//           {/* Skills Select component */}
//           <div className=' w-full grid grid-cols-1  mb-3 '>
//             <label className='home-search-label' htmlFor='grid-skills'>
//               Skills
//             </label>
//             <Select<Option>
//               styles={{
//                 control: (baseStyles, state) => ({
//                   ...baseStyles,
//                   borderColor: state.isFocused ? "grey" : "transparent",
//                 }),
//               }}
//               className='home-search-select-field'
//               id='grid-skills'
//               placeholder='Add Skills'
//               options={skillOptions}
//               isMulti
//               value={formData.selectedSkills}
//               onChange={handleSkillsChange}
//             />
//           </div>

//           {/* Search button */}
//           <div className=' home-search-btn-content  '>
//             <button className=' md:w-[56px] md:h-[56px] mt-[4px]' type='submit'>
//               <img
//                 className='md:w-full md:h-full w-[56px] h-[56px]'
//                 src={searchImg}
//                 alt='searchJob'
//               />
//             </button>
//           </div>
//         </div>
//       </form>

//       <RefineSearchModal isOpen={isOpen} onClose={onClose} />
//     </div>
//   );
// };

// export default RefineSearchBar;
