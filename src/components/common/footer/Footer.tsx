import React from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../../../assets/logo-main.jpg";
interface FooterLink {
  title: string;
  path: string;
}

const footerLinks: FooterLink[] = [
  {
    title: "Help Center",
    path: "/", // Path for Help Center
  },
  {
    title: "FAQs",
    path: "/", // Path for FAQs
  },
  {
    title: "Support Team",
    path: "/", // Path for Support Team
  },
  {
    title: "How It Works",
    path: "/", // Path for How It Works
  },
  {
    title: "Contact Support",
    path: "/", // Path for Contact Support
  },
];

const Footer: React.FC = () => {
  const { pathname } = useLocation();
  const noMargin = pathname === "/search-result" || pathname === "/";

  return (
    <>
      {/* Footer Container */}
      <div
        className={`${
          noMargin ? "xl:ml-[22rem]" : "mt-[76px]"
        } border-t shadow-[0px 2px 10px rgba(3,3,3,0.1)]`}>
        <div className='md:px-16 px-10 mx-auto py-8'>
          <div className='flex flex-col items-start sm:justify-between sm:items-center sm:flex-row'>
            {/* Footer Left Content */}
            <div className='sm:pb-0 pb-8'>
              {/* Footer logo start */}
              <div>
                <span className='text-[#030303] w-[170px] text-2xl font-semibold leading-9'>
                  {/* Link to the homepage */}
                  <div className='w-[60px] h-[60px] mb-3'>
                    <Link to='/'>
                      <img src={Logo} className='w-full h-full' alt='Logo' />
                    </Link>
                  </div>
                </span>
              </div>
              {/* Footer logo end */}

              <div>
                <p className='text-primary font-sans text-xs font-light'>
                  Empowering job seekers since 2021!
                </p>
              </div>

              {/* Large Screen Copyright text start */}
              <div className='mt-8 sm:block hidden'>
                <p className='text-primary font-sans text-xs font-light'>
                  Go Careers © 2021
                </p>
              </div>
              {/* Large Screen Copyright text end */}
            </div>
            {/* End of Footer Left Content */}

            {/* Footer Right Content */}
            <div className='hidden'>
              <ul>
                {/* Mapping footer links */}
                {footerLinks?.map((footerLink, index) => (
                  <li
                    key={index}
                    className={`text-primary font-sans text-xs text-left sm:text-right pb-2 ${
                      index === 0 ? "font-medium" : "font-light" // Applying font-medium class to the first index
                    }`}>
                    {/* Link to each footer item */}
                    <Link to={footerLink.path}>{footerLink.title}</Link>
                  </li>
                ))}
              </ul>

              {/* Small Screen Copyright text start */}
              <div className='mt-8 sm:hidden block'>
                <p className='text-primary font-sans text-xs font-light'>
                  Go Careers © 2022
                </p>
              </div>
              {/* Small Screen  Copyright text end */}
            </div>
            {/* End of Footer Right Content */}
          </div>
        </div>
      </div>
      {/* End of Footer Container */}
    </>
  );
};

export default Footer;
