import React, { useState } from "react";
import {
  IoIosArrowDropleftCircle,
  IoIosArrowDroprightCircle,
} from "react-icons/io";
import { Outlet } from "react-router-dom";
import DashboardSidebar from "../components/common/dashboard-sidebar/DashboardSidebar";
import Header from "../components/personal-profile/header/Header";

const DashboardLayout: React.FC = () => {
  // State to control visibility
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Toggle visibility on click
  const toggleVisibility = () => {
    if (isVisible) {
      // Check if the device width is greater than or equal to 768 pixels
      const isDeviceLarge = window.matchMedia("(min-width: 768px)").matches;

      // Set isVisible to true if the device width is large, otherwise set it to false
      setIsVisible(isDeviceLarge);
    }
    setIsVisible(!isVisible);
  };

  return (
    <>
      {/* Dashboard Header */}
      <Header />
      {/* Dashboard Sidebar */}
      <div className='flex pt-[69px] container max-w-container'>
        <DashboardSidebar
          toggleVisibility={toggleVisibility}
          isVisible={isVisible}
        />

        <main className='container max-w-container'>
          {/* Toggle visibility on click */}
          <div
            onClick={toggleVisibility}
            className=' cursor-pointer text-3xl mt-[18px]'>
            {/* Toggle between XMarkIcon and Bars3BottomRightIcon based on the open state */}
            {isVisible ? (
              <IoIosArrowDropleftCircle />
            ) : (
              <IoIosArrowDroprightCircle />
            )}
          </div>
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default DashboardLayout;
