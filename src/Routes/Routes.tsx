import { createHashRouter } from "react-router-dom";
import Layout from "../Layout/Layout";
import JobDetails from "../pages/JobDetails";
import SearchResult from "../pages/SearchResult";

const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      /*  {
        path: "/",
        element: <Home />,
      },
      {
        path: "/home",
        element: <Home />,
      }, */
      {
        path: "",
        element: <SearchResult />,
      },
      {
        path: "search-result",
        element: <SearchResult />,
      },
      {
        path: "job-info/:jobId",
        element: <JobDetails />,
      },
    ],
  },
  // {
  //   path: "/dashboard",
  //   element: <DashboardLayout />,
  //   children: [
  //     {
  //       path: "profile-details",
  //       element: <Profile />,
  //     },
  //     {
  //       path: "payment-methods",
  //       element: <PaymentMethod />,
  //     },
  //     {
  //       path: "privacy",
  //       element: <Privacy />,
  //     },
  //   ],
  // },
]);

export default router;
