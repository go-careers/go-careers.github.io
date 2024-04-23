import Footer from "../components/common/footer/Footer";
import PageTitle from "../components/common/page-title/PageTitle";
import Navbar from "../components/search-results/navbar/Navbar";
import SearchResultLayout from "../components/search-results/search-result-layout/SearchResultLayout";

export default function SearchResult() {
    return (
        <>
            <PageTitle title="Home" />
            <Navbar />

            <SearchResultLayout />

            <Footer />
        </>
    );
}
