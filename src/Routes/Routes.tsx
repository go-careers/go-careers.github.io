import { createBrowserRouter } from "react-router-dom";
import DashboardLayout from "../Layout/DashboardLayout";
import Layout from "../Layout/Layout";
import JobDetails from "../pages/JobDetails";
import PaymentMethod from "../pages/PaymentMethod";
import Privacy from "../pages/Privacy";
import Profile from "../pages/Profile";
import SearchResult from "../pages/SearchResult";

const router = createBrowserRouter([
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
        path: "/",
        element: <SearchResult />,
      },
      {
        path: "/search-result",
        element: <SearchResult />,
      },
      {
        path: "/job-info/:jobId",
        element: <JobDetails />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      {
        path: "profile-details",
        element: <Profile />,
      },
      {
        path: "payment-methods",
        element: <PaymentMethod />,
      },
      {
        path: "privacy",
        element: <Privacy />,
      },
    ],
  },
]);

export default router;
