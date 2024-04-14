import { useEffect, useState } from "react";
import Cards from "../../common/home-card/Cards";

export default function PromotedCompanies() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("./promoted-companies.json");
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className='md:px-16 px-7'>
      <h1 className='promoted-companies'>Promoted Companies</h1>
      <div className='card-grid mb-[75px]'>
        {data.map((val, index) => (
          <Cards key={index} val={val} />
        ))}
      </div>
    </div>
  );
}
