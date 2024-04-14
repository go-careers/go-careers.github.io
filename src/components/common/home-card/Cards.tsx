import React from "react";
import { getImgUrl } from "../../../utils/utility";

interface CardProps {
  val: {
    icon: string;
    title: string;
    postCounts: string;
  };
}

const Cards: React.FC<CardProps> = ({ val }) => {
  return (
    <div className='home-card'>
      <img
        className="w-['71px'] h-['73px'] mb-6"
        src={getImgUrl(`${val?.icon}`)}
        alt={val?.icon}
      />
      <h2 className='text-[#030303] text-2xl font-semibold leading-[31px] mb-1'>
        {val?.title}
      </h2>
      <small className='text-[#7d7d7d] text-base leading-5'>
        {val?.postCounts}
      </small>
    </div>
  );
};

export default Cards;
