import React from "react";
import { Range } from "react-range";

interface FormRangeProps {
  values: number[];
  onChange: (values: number[]) => void;
}

const FormRange: React.FC<FormRangeProps> = ({ values, onChange }) => {
  return (
    <div>
      <label
        htmlFor='default-range'
        className='block mb-3 sm:mb-5 font-bold text-tertiary text-base'>
        Job type
      </label>
      <Range
        step={1}
        min={0}
        max={100}
        values={values}
        onChange={onChange}
        renderTrack={({ props, children }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: "2px",
              width: "100%",
              backgroundColor: "#f0f0f0",
              borderRadius: "2px",
              position: "relative",
            }}>
            {children}
            <div
              style={{
                position: "absolute",
                height: "2px",
                width: `${values[1] - values[0]}%`,
                left: `${values[0]}%`,
                backgroundColor: "#dedede",
                borderRadius: "2px",
                pointerEvents: "none",
                zIndex: -1,
              }}
            />
          </div>
        )}
        renderThumb={({ props }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: "16px",
              width: "16px",
              backgroundColor: "#ffffff",
              borderRadius: "50%",
              boxShadow: "0px 2px 10px rgba(3,3,3,0.1)",
            }}
          />
        )}
      />
    </div>
  );
};

export default FormRange;
