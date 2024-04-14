import Footer from "../components/common/footer/Footer";
import PageTitle from "../components/common/page-title/PageTitle";
// import Banner from "../components/home-components/banner/Banner";
import MostPopularCategories from "../components/home-components/most-popular-categories/MostPopularCategories";
import Navbar from "../components/home-components/navbar/Navbar";
import PromotedCompanies from "../components/home-components/promoted-companies/PromotedCompanies";

export default function Home() {
  return (
    <>
      <PageTitle title='Home' />
      <Navbar />
      {/* <Banner /> */}
      <MostPopularCategories />
      <PromotedCompanies />
      <Footer />
    </>
  );
}
