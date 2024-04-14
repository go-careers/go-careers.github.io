import { useEffect, useState } from "react";
import Cards from "../../common/home-card/Cards";

export default function MostPopularCategories() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("./most-popular-categories.json");
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className='md:px-16 px-7  mt-[440px] smd:mt-[345px]  md:mt-[360px] xlg:mt-[370px] '>
      <h1 className='most-popular-categories-title'>Most Popular Categories</h1>

      <div className='card-grid'>
        {data.map((val, index) => (
          <Cards key={index} val={val} />
        ))}

        {/* view all card */}
        <div className='view-all-card'>
          <h2 className='view-all-title'>+10K jobs</h2>
          <small className='view-all-available'>Available now!</small>
          <button className='view-all-btn'>View all</button>
        </div>
      </div>
    </div>
  );
}
