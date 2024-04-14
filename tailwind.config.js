/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      xsm: "0px",
      jobCard: "420px",
      sm: "576px",
      smd: "620px",
      job_posted_at: "640px",
      md: "768px",
      lg: "976px",
      mdlg: "1050px",
      xlg: "1124px",
      xl: "1200px",
      xxl: "1400px",
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "4rem",
        "2xl": "4rem",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
      },
      backgroundImage: {
        banner: "url('./src/assets/images/banner.png')",
      },
      boxShadow: {
        search: "0px 2px 10px rgba(3,3,3,0.1)",
        sidebar: "2px 1px 3px 0px rgba(0, 0, 0, 0.1)",
      },
      colors: {
        primary: "#030303", //color primary for font
        secondary: "#858585", //color secondary for font
        tertiary: "#080a0b", //color tertiary for font
        bgbtn: "#4869d7",
        bgbdr: "#242426", //color bqborer for border1
        bgbdr1: "#dfdfdf", //color bqborer for border1
      },
      maxWidth: {
        container: "1340px", // Default container width
      },
    },
  },
  plugins: [],
};
