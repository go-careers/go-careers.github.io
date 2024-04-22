/* eslint-disable @typescript-eslint/no-unused-vars */
import "rc-slider/assets/index.css";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select, { CSSObjectWithLabel } from "react-select";
import {
    useGetAllJobLocationQuery,
    useGetJobsFilterOptionQuery,
} from "../../../../../redux/features/queries/Job_APIS";
import { updateFormState } from "../../../../../redux/features/slices/filters/AdvanceSearchSlice";
import { updateFilters } from "../../../../../redux/features/slices/filters/JobFilterSlices";
import { CustomSelect } from "./CustomSelect";
import { JobPostedInOptions } from "../../../../configs/FilterOptionConfigs";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

interface AdvanceSearchProps {
    setShow: Dispatch<SetStateAction<boolean>>;
}

const AdvanceSearch: React.FC<AdvanceSearchProps> = ({ setShow }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [rerenderKey, setRerenderKey] = useState(0);

    // const {
    //     job_type,
    //     job_location,
    //     yoe,
    //     posted_in_days,
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // } = useSelector((state: any) => state.filters);

    const { data: jobLocationsData } = useGetAllJobLocationQuery({});

    const { data: filterData } = useGetJobsFilterOptionQuery({});
    const emp_type = filterData?.data?.emp_type || [];

    const jobLocations = jobLocationsData?.data?.map(
        (location: { city: any; id: any }) => ({
            label: location.city,
            value: location.id,
        })
    );

    const jobTypeOptions = filterData?.data?.job_type?.map(
        (jobType: unknown) => ({
            label: jobType,
            value: jobType,
        })
    );

    type Option = typeof jobLocations;

    // Parse query parameters from URL and set it to initial form data
    const initialFormData = {
        job_location: (searchParams.get("job_location") || "")
            .split("%")
            .filter(Boolean),
        job_type: searchParams.get("job_type") || "",
        yoe: parseInt(searchParams.get("yoe") || "0"),
        emp_type: searchParams.get("emp_type") || "",
        posted_in_days: searchParams.get("posted_in_days") || undefined,
    };

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        const queryParamsObject: { [key: string]: any } = {};

        for (const [key, value] of searchParams.entries()) {
            if (key === "job_location" && value.length > 0) {
                queryParamsObject[key] = value.split("%");
            } else if (key === "yoe") {
                queryParamsObject[key] = parseInt(value, 10);
            } else if (key === "posted_in_days") {
                queryParamsObject[key] = parseInt(value, 10);
            } else {
                queryParamsObject[key] = value;
            }
        }
        setRerenderKey((prevKey) => prevKey + 1);

        dispatch(updateFilters(queryParamsObject));
    }, [searchParams]);

    // Handle Form Submission
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setShow(false);

        const { job_location, job_type, yoe, emp_type, posted_in_days } =
            formData;

        const searchParamsString = {
            ...(job_location.length > 0 && {
                job_location: job_location.join("%"),
            }),
            ...(job_type && { job_type }),
            ...(yoe && { yoe: yoe.toString() }),
            ...(emp_type && { emp_type }),
            ...(posted_in_days && { posted_in_days }),
        };

        const searchParams = new URLSearchParams(searchParamsString);
        navigate(`/?${searchParams.toString()}`, {
            replace: true,
        });
    };

    //Handle Form Reset
    const resetForm = (e: any) => {
        e.preventDefault();
        setFormData({
            job_location: [],
            job_type: "",
            yoe: 0,
            emp_type: "",
            posted_in_days: undefined,
        });
        window.location.replace("/");
        // dispatch(updateFilters(formData));
    };

    const handleChange = (
        e: React.ChangeEvent<
            | HTMLInputElement
            | HTMLSelectElement
            | { name?: string; value: unknown }
        >
    ) => {
        let name: string | undefined;
        let value: string | unknown;

        if ("target" in e) {
            name = e.target.name;
            value = e.target.value;
        }

        // Update the specific form field in formData and if INTERNSHIP then set yoe to 0 as it is not applicable for internships
        if (name === "emp_type" && value === "INTERNSHIP") {
            setFormData((prevFormData) => ({
                ...prevFormData,
                [name!]: value,
                yoe: 0,
            }));
        } else {
            setFormData((prevFormData) => ({
                ...prevFormData,
                [name!]: value,
            }));
        }

        // Dispatch updateFormState with updated formData
        dispatch(updateFormState({ ...formData, [name!]: value }));
    };

    const handleLocationChange = (
        selectedOptions: { label: any; value: any }[]
    ) => {
        const selectedLocationValues = selectedOptions?.map(
            (option: { label: any; value: any }) => option.value
        );
        setFormData((prevFormData) => ({
            ...prevFormData,
            job_location: selectedLocationValues,
        }));
        dispatch(
            updateFormState({
                ...formData,
                job_location: selectedLocationValues,
            })
        );
    };

    const handleYoeChange = (value: number) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            yoe: value,
        }));
        dispatch(updateFormState({ ...formData, yoe: value }));
    };

    return (
        <div>
            <div className="md:px-16 px-10 pb-6">
                <div>
                    <h2 className="text-[#030303] text-xl font-medium leading-[30px] mt-[18px]">
                        Search for jobs
                    </h2>

                    <form onSubmit={handleSubmit} key={rerenderKey}>
                        {/* Employment Type Field */}
                        <div className="mt-4">
                            <label
                                htmlFor="employmentType"
                                className="text-[#030303] text-sm font-bold leading-[22px]"
                            >
                                Employment type
                            </label>
                            <div className="relative">
                                <Select<Option>
                                    styles={{
                                        control: (baseStyles, state) => ({
                                            ...baseStyles,
                                            borderColor: state.isFocused
                                                ? "grey"
                                                : "transparent",
                                        }),
                                    }}
                                    className="md:w-[280px] w-full h-[42px] text-sm z-10"
                                    id="grid-employment-type"
                                    placeholder="Select employment type"
                                    options={emp_type.map((type: string) => ({
                                        label: type,
                                        value: type,
                                    }))}
                                    value={emp_type
                                        .map((type: string) => ({
                                            label: type,
                                            value: type,
                                        }))
                                        .find(
                                            (option: { value: string }) =>
                                                option.value ===
                                                formData.emp_type
                                        )}
                                    onChange={(selectedOption) =>
                                        handleChange({
                                            target: {
                                                name: "emp_type",
                                                value: selectedOption?.value,
                                            },
                                        } as React.ChangeEvent<HTMLSelectElement>)
                                    }
                                />
                            </div>
                        </div>
                        {/* Location Field */}
                        <div className="mt-4">
                            <label
                                htmlFor="location"
                                className="text-[#030303] text-sm font-bold leading-[22px]"
                            >
                                Location
                            </label>

                            <div className="relative">
                                <CustomSelect
                                    placeholder="Where do you want to work?"
                                    multiple
                                    options={jobLocations}
                                    value={jobLocations?.filter(
                                        (option: { value: string }) =>
                                            formData?.job_location?.includes(
                                                option.value
                                            )
                                    )}
                                    onChange={handleLocationChange}
                                />
                            </div>
                        </div>

                        {/* Job Type Field */}
                        <div className="mt-4">
                            <label
                                htmlFor="jobType"
                                className="text-[#030303] text-sm font-bold leading-[22px]"
                            >
                                Job type
                            </label>
                            <div className="relative">
                                <Select<Option>
                                    styles={{
                                        control: (
                                            baseStyles: CSSObjectWithLabel,
                                            state: { isFocused: unknown }
                                        ) => ({
                                            ...baseStyles,
                                            borderColor: state.isFocused
                                                ? "grey"
                                                : "transparent",
                                        }),
                                    }}
                                    className="md:w-[280px] w-full h-[42px] text-sm z-30"
                                    id="grid-job-type"
                                    placeholder="Select job type"
                                    options={jobTypeOptions}
                                    value={jobTypeOptions?.find(
                                        (option: { value: unknown }) =>
                                            option.value === formData.job_type
                                    )}
                                    onChange={(selectedOption) =>
                                        handleChange({
                                            target: {
                                                name: "job_type",
                                                value: selectedOption?.value,
                                            },
                                        } as React.ChangeEvent<HTMLSelectElement>)
                                    }
                                />
                            </div>
                        </div>

                        {/* Min and Max Experience Level */}
                        <div className="mt-4 md:w-[280px] w-full">
                            <label className="text-[#030303] me-2 text-sm font-bold leading-[22px]">
                                Experience in years
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="border disabled outline-none rounded-sm w-full h-10 text-center"
                                    disabled={
                                        formData.emp_type === "INTERNSHIP"
                                    }
                                    min={0}
                                    value={formData.yoe}
                                    onChange={(e) =>
                                        handleYoeChange(
                                            parseInt(e.target.value)
                                        )
                                    }
                                />
                                {/* <input
                  style={{
                    control: (
                      baseStyles: CSSObjectWithLabel,
                      state: { isFocused: unknown }
                    ) => ({
                      ...baseStyles,
                      borderColor: state.isFocused ? "grey" : "transparent",
                    }),
                  }}
                  className='md:w-[280px] w-full h-[42px] text-sm z-30'
                  id='grid-job-type'
                  placeholder='Select job type'
                  options={jobTypeOptions}
                  value={jobTypeOptions?.find(
                    (option: { value: unknown }) =>
                      option.value === formData.job_type
                  )}
                  onChange={(selectedOption) =>
                    handleChange({
                      target: {
                        name: "job_type",
                        value: selectedOption?.value,
                      },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                /> */}
                            </div>
                            {/* <div className='flex items-center justify-between'>
                <div className='flex items-center justify-between w-full mb-3'>
                  <div className='flex items-center w-[100px]'>
                    <label className='text-[#030303] me-2 text-sm leading-[22px]'>
                      Min
                    </label>
                    <input
                      type='text'
                      className='border disabled outline-none rounded-sm w-full h-10 text-center'
                      readOnly
                      value={formData.min_exp}
                    />
                  </div>
                  <div>
                    <hr className='w-5' />
                  </div>
                  <div className='flex items-center w-[100px]'>
                    <label className='text-[#030303] text-sm me-2 leading-[22px]'>
                      Mix
                    </label>
                    <input
                      type='text'
                      className='border disabled text-center outline-none rounded-sm w-full h-10'
                      readOnly
                      value={formData.max_exp}
                    />
                  </div>
                </div> */}
                            {/* </div> */}
                            {/* <div className='relative'>
                <Slider
                  range
                  min={0}
                  max={20}
                  disabled={empType === "INTERNSHIP"}
                  trackStyle={[{ backgroundColor: "#607edf" }]}
                  defaultValue={[0, 20]}
                  onChange={handleSliderChange}
                />
              </div> */}
                        </div>

                        {/* Job posted in days filter */}
                        <div className="mt-4">
                            <label
                                htmlFor="postedInDays"
                                className="text-[#030303] text-sm font-bold leading-[22px]"
                            >
                                Job posted in
                            </label>
                            <div className="relative">
                                <Select<Option>
                                    styles={{
                                        control: (baseStyles, state) => ({
                                            ...baseStyles,
                                            borderColor: state.isFocused
                                                ? "grey"
                                                : "transparent",
                                        }),
                                    }}
                                    className="md:w-[280px] w-full h-[42px] text-sm z-5"
                                    id="grid-job-posted-in-days"
                                    placeholder="Select duration of job post"
                                    options={JobPostedInOptions}
                                    value={JobPostedInOptions.find(
                                        (option: { value: string }) =>
                                            option.value ===
                                            formData.posted_in_days
                                    )}
                                    onChange={(selectedOption) =>
                                        handleChange({
                                            target: {
                                                name: "posted_in_days",
                                                value: selectedOption?.value,
                                            },
                                        } as React.ChangeEvent<HTMLSelectElement>)
                                    }
                                />
                            </div>
                        </div>

                        {/* Submit btn */}
                        <div className="mt-6 flex flex-col gap-3 ">
                            <button className="submit-button" type="submit">
                                Find jobs
                            </button>
                            <button
                                className="cursor-pointer md:w-[280px] w-full h-[42px] box-border transition-all hover:bg-red-600 bg-red-500 text-white text-sm leading-[18px] px-2 py-0 rounded-3xl border-0"
                                type="reset"
                                onClick={resetForm}
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdvanceSearch;
