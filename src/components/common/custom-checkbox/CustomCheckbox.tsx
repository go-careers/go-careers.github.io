/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

interface CustomCheckboxProps {
  title: string;
  id: string;
  [key: string]: any; // Allow additional attributes
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  title,
  id,
  ...attributes
}) => {
  return (
    <div className='mt-1 sm:mt-4 block mb-[5px] custom-checkbox'>
      <input
        type='checkbox'
        {...attributes}
        className='absolute opacity-0 h-[initial] w-[initial] hidden cursor-pointer mb-0 p-0'
        id={id}
      />
      <label
        htmlFor={id}
        className='ml-2 text-tertiary text-xs font-medium leading-4 relative cursor-pointer'>
        {title}
      </label>
    </div>
  );
};

export default CustomCheckbox;
