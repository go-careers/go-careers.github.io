import { Bars3BottomRightIcon, XMarkIcon } from "@heroicons/react/24/solid";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import headerUser from "../../../assets/profile-page-assets/user.png";

interface LinkItem {
  name: string;
  link: string;
}

const Header: React.FC = () => {
  const Links: LinkItem[] = [
    // { name: "Search for jobs", link: "#" },
    // { name: "Explore", link: "#" },
    // { name: "Trending", link: "#" },
  ];

  // State to manage the visibility of the mobile menu
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div className='dashboard-header'>
      <div className='container max-w-container'>
        <div className='  py-4 '>
          {/* Logo section */}
          <div className='profile-logo-section'>
            <span className='profile-logo'>
              {/* Link to the homepage */}
              <Link to='/'>Go Careers</Link>
            </span>
            {/* Link items */}
            <div
              className={` profile-nav-items hidden ${
                open
                  ? "top-12  h-screen lg:h-[40px] "
                  : "top-[-490px] md:opacity-100 md:visible opacity-0 invisible"
              }`}>
              <ul className='profile-nav-item-list'>
                {/* Map over the Links array to render each link */}
                {Links.map((link, i) => (
                  <li key={i} className='md:ml-8 md:my-0 my-7 font-semibold'>
                    {/* Conditionally render the button if the link's name is "Search for" */}
                    {link.name === "Search for " ? (
                      <Link to='#' className='link-item-text'>
                        <button>{link.name}</button>
                      </Link>
                    ) : (
                      <Link to={link.link} className='link-item-text'>
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              {/* Header User image */}
              <div className='hidden'>
                <img src={headerUser} alt='' />
              </div>
            </div>
          </div>

          {/* Menu icon for mobile view */}
          <div
            onClick={() => setOpen(!open)}
            className='home-menu-toggle hidden '>
            {/* Toggle between XMarkIcon and Bars3BottomRightIcon based on the open state */}
            {open ? <XMarkIcon /> : <Bars3BottomRightIcon />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
