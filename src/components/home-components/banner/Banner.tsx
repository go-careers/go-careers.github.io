// import RefineSearchBar from "../refine-search-bar/RefineSearchBar";
// // Import the banner image that will be used as the background for the banner.
// import { useState } from "react";
// import bannerImg from "../../../assets/home-page-assets/home-banner.png";

// export default function Banner() {
//   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

//   const openRefineSearchModal = () => {
//     setIsModalOpen(true);
//   };

//   const closeRefineSearchModal = () => {
//     setIsModalOpen(false);
//   };

//   return (
//     // The outermost container for the banner.
//     <div className='md:px-16 px-7 mt-[70px] relative'>
//       {/* // The main banner div with a background image and styling. */}
//       <div
//         className='relative flex flex-col items-center justify-center h-[290px] bg-no-repeat bg-cover rounded-3xl z-[-1]'
//         style={{
//           // Set the background image to the imported banner image.
//           backgroundImage: `url(${bannerImg})`,
//           // Ensure the background image covers the entire div.
//           backgroundSize: "cover",
//           // Center the background image.
//           backgroundPosition: "center",
//         }}>
//         {/* // An overlay div with a white background and reduced opacity to create a fade effect. */}
//         <div className='absolute inset-0 bg-white opacity-50 rounded-3xl z-[-9]'></div>
//         {/* // The content container for the banner text. */}
//         <div>
//           {/* // The main heading for the banner. */}
//           <h1 className='font-sans font-semibold text-primary text-center text-3xl smd:text-[34px]  md:text-4xl lg:text-[40px] leading-10'>
//             {" "}
//             Find your dream job on JobHub
//           </h1>
//           {/* // The subheading for the banner. */}
//           <p className='font-sans text-base md:text-xl text-center text-primary mt-4'>
//             Discover thousands of job listings just for you!
//           </p>
//         </div>
//         {/* // The RefineSearchBar component is rendered here. */}
//       </div>
//       {/* // Render the RefineSearchBar component below the banner. */}
//       <RefineSearchBar
//         isOpen={isModalOpen}
//         openRefineSearchModal={openRefineSearchModal}
//         onClose={closeRefineSearchModal}
//       />
//     </div>
//   );
// }
