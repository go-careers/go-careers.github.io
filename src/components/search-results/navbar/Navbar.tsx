import { Bars3BottomRightIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../../../assets/logo-main.jpg";

interface LinkItem {
  name: string;
  link: string;
}

const Navbar: React.FC = () => {
  const links: LinkItem[] = [
    // { name: "Featured Jobs", link: "#" },
    // { name: "Top Employers", link: "#" },
    // { name: "Recommended Roles", link: "#" },
  ];

  const [open, setOpen] = useState(false);

  return (
    <div className='shadow-md w-full fixed top-0 left-0 z-[1] border-b bg-white backdrop-blur-2xl transition-colors duration-500'>
      <div className='lg:flex items-center justify-between py-4 lg:px-16 px-7 '>
        {/* Logo section */}
        <div className='font-bold text-2xl cursor-pointer flex items-center gap-1 w-full'>
          <span className='text-[#030303] w-[170px] text-2xl font-semibold leading-9'>
            {/* Link to the homepage */}
            <div className='w-[60px] h-[60px]'>
              <Link to='/' >
                <img src={Logo} className='w-full h-full' alt='Logo' />
              </Link>
            </div>
          </span>
          {/* Link items */}
          <div
            className={`border-b bg-white shadow-md lg:shadow-none backdrop-blur-2xl lg:bg-transparent lg:border-0   lg:flex lg:justify-between lg:items-center lg:pb-0 pb-12 absolute lg:static  lg:z-auto z-[-1] left-0 w-full lg:pl-0 pl-5 transition-all duration-500 ease-in ${
              open ? "top-12  h-screen lg:h-[40px]" : "top-[-490px]"
            }`}>
            <ul className='lg:flex  lg:justify-between lg:items-center lg:pb-0 pb-12  lg:z-auto z-[-1] left-0 w-full lg:w-auto lg:pl-0 pl-2 transition-all duration-500'>
              {/* Map over the Links array to render each link */}
              {links.map((link, i) => (
                <li key={i} className='lg:ml-8 lg:my-0 my-7 font-semibold'>
                  <Link
                    to={link.link}
                    className='text-slate-700 font-medium  text-sm leading-[22px]'>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            {/* Buttons for Apply Now and Sign In */}
            <div>
              {/* <button className='w-[116px] h-[38px] border box-border bg-white text-[#030303] text-sm leading-[18px] px-2 py-0 rounded-3xl border-solid border-[#030303] me-4'>
                Apply Now
              </button>
              <button className='w-[108px] h-[38px] box-border bg-[#4869d7] text-white text-sm leading-[18px] px-2 py-0 rounded-3xl border-0'>
                Sign In
              </button> */}
              <span className="text-sm">
                Empowering job seekers since 2021!
              </span>
            </div>
          </div>
        </div>
        {/* Menu icon for mobile view */}
        <div
          onClick={() => setOpen(!open)}
          className='absolute right-8 top-6 cursor-pointer lg:hidden w-7 h-7 hidden '>
          {/* Toggle between XMarkIcon and Bars3BottomRightIcon based on the open state */}
          {open ? <XMarkIcon /> : <Bars3BottomRightIcon />}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
