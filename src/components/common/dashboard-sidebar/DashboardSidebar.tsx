import PropTypes from "prop-types";
import React from "react";
import {
  IoIosArrowDropleftCircle,
  IoIosArrowDroprightCircle,
} from "react-icons/io";
import { Link, useLocation } from "react-router-dom";
import addConnectionIcon from "../../../../src/assets/profile-page-assets/addConnectionIcon.png";
import alertIcon from "../../../../src/assets/profile-page-assets/alertIcon.png";
import homeIcon from "../../../../src/assets/profile-page-assets/backhome.png";
import jobIcon from "../../../../src/assets/profile-page-assets/jobIcon.png";
import paymentIcon from "../../../../src/assets/profile-page-assets/paymenticon.png";
import privacyIcon from "../../../../src/assets/profile-page-assets/privacyIcon.png";
import signOutIcon from "../../../../src/assets/profile-page-assets/signOutIcon.png";
import profileIcon from "../../../../src/assets/profile-page-assets/usericon.png";

interface LinkItem {
  name: string;
  icon: string;
  link: string;
}

const Links: LinkItem[] = [
  {
    name: "Profile details",
    icon: profileIcon,
    link: "/dashboard/profile-details",
  },
  {
    name: "Payment Method",
    icon: paymentIcon,
    link: "/dashboard/payment-methods",
  },
  { name: "Privacy", icon: privacyIcon, link: "/dashboard/privacy" },
  { name: "Job", icon: jobIcon, link: "#" },
  { name: "Alert", icon: alertIcon, link: "#" },
  { name: "Add connection", icon: addConnectionIcon, link: "#" },
];

interface DashboardSidebarProps {
  isVisible: boolean;
  toggleVisibility: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isVisible,
  toggleVisibility,
}) => {
  const location = useLocation();

  return (
    <div
      className={` ${
        isVisible
          ? " sidebar-visible"
          : " transition-all duration-200 opacity-0 invisible "
      } `}>
      <div className='fixed w-[243px] shadow-sidebar bg-white'>
        <div className='h-dvh flex flex-col'>
          <div className='mt-6'>
            <div
              onClick={toggleVisibility}
              className='md:hidden text-3xl absolute right-0 top-[18px]'>
              {isVisible ? (
                <IoIosArrowDroprightCircle />
              ) : (
                <IoIosArrowDropleftCircle />
              )}
            </div>
            <Link to={"/"} className='link-item-text'>
              <img className='w-5' src={homeIcon} alt='' />
            </Link>
            <h2 className=' text-primary text-xl font-medium mt-6 mb-6'>
              Account settings
            </h2>
            <ul>
              {Links.map((link, i) => (
                <Link key={i} to={link.link} className='link-item-text'>
                  <li
                    className={`flex items-center gap-2 text-base text-primary mb-6 ${
                      location.pathname === link.link ? "font-semibold" : ""
                    }`}>
                    <span>
                      <img src={link.icon} alt={link.name} />
                    </span>
                    {link.name}
                  </li>
                </Link>
              ))}
            </ul>
          </div>
          <ul className='my-auto'>
            <li className='flex items-center gap-2 text-base cursor-pointer  text-primary mb-6'>
              <span>
                <img src={signOutIcon} alt='' />
              </span>
              Sign out
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

DashboardSidebar.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  toggleVisibility: PropTypes.func.isRequired,
};

export default DashboardSidebar;
