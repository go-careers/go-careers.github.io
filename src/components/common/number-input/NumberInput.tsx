/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

interface NumberInputProps {
  title: string;
  [key: string]: any; // Allow additional attributes
}

const NumberInput: React.FC<NumberInputProps> = ({ title, ...attributes }) => {
  return (
    <div className='mt-1 w-full'>
      <label className='text-tertiary text-xs font-medium leading-4'>
        {title}
      </label>
      <br />
      <input type='number' className='input-text' {...attributes} />
    </div>
  );
};

export default NumberInput;
