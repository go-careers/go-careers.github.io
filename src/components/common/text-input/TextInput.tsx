/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

interface TextInputProps {
  title: string;
  [key: string]: any; // Allow additional attributes
}

const TextInput: React.FC<TextInputProps> = ({ title, ...attributes }) => {
  return (
    <div className='mt-2 sm:mt-4 w-full'>
      <label className='text-tertiary text-xs font-medium leading-4'>
        {title}
      </label>
      <br />
      <input type='text' className='input-text' {...attributes} />
    </div>
  );
};

export default TextInput;
