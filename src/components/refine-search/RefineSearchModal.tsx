/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import iconFilter from "./../../assets/refine-search-modal-assets/Icon-filter.png";
import CustomCheckbox from "./../common/custom-checkbox/CustomCheckbox";
import CustomCheckboxTwo from "./../common/custom-checkbox/CustomCheckboxTwo";
import FormRange from "./../common/form-range/FormRange";
import NumberInput from "./../common/number-input/NumberInput";
import TextInput from "./../common/text-input/TextInput";
import ExperienceLevelCard from "./experience-level-card/ExperienceLevelCard";

interface CheckboxStates {
  fullTime: boolean;
  location: boolean;
  bachelors: boolean;
  masters: boolean;
  remoteWork: boolean;
  health: boolean;
  flexible: boolean;
}

interface RefineSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RefineSearchModal({
  isOpen,
  onClose,
}: RefineSearchModalProps) {
  const [values, setValues] = useState<[number, number]>([25, 75]);
  const [experienceData, setExperienceData] = useState<any[]>([]);
  const [checkboxStates, setCheckboxStates] = useState<CheckboxStates>({
    fullTime: true,
    location: true,
    bachelors: true,
    masters: true,
    remoteWork: true,
    health: true,
    flexible: true,
  });

  const handleCheckboxChange = (checkboxName: keyof CheckboxStates) => {
    setCheckboxStates((prevState) => ({
      ...prevState,
      [checkboxName]: !prevState[checkboxName],
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "../../../../mock-data/experience-level.json"
        );
        const jsonData = await response.json();
        setExperienceData(jsonData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const toggleModal = () => {
    onClose();
  };

  const handleRangeChange = (newValues: number[]) => {
    // Assuming newValues always has two elements, you can destructure them directly
    const [start, end] = newValues;
    setValues([start, end]); // Ensure to provide an array with two elements
  };

  return (
    <>
      {isOpen && (
        <div className='fixed z-[99] inset-0 overflow-y-auto'>
          <div className='modal-section'>
            <div
              className='fixed inset-0 transition-opacity'
              aria-hidden='true'
              onClick={toggleModal}>
              <div className='modal-overlay'></div>
            </div>
            <span
              className='hidden sm:inline-block sm:align-middle sm:h-screen'
              aria-hidden='true'>
              &#8203;
            </span>

            <div className='modal-dialogue-box  shadow-[0px 2px 10px rgba(3,3,3,0.1)]'>
              <form>
                <div className='flex justify-between items-center'>
                  <h3 className='modal-title ' id='modal-title'>
                    Refine Search
                  </h3>

                  <div>
                    <img
                      src={iconFilter}
                      alt='filter'
                      className='w-[20px] h-[20px]'
                    />
                  </div>
                </div>

                <div className='sm:mt-7 mt-5'>
                  <FormRange values={values} onChange={handleRangeChange} />

                  <div className='form-input-content'>
                    <TextInput title='Full-time' placeholder='Entry salary' />

                    <TextInput title='Location' placeholder='Entry city' />
                  </div>

                  <div className='mt-3 sm:mt-5'>
                    <h5 className='font-bold text-tertiary text-base '>
                      Experience level
                    </h5>

                    <div className='mt-2 grid grid-cols-1  sm:grid-cols-4 sm:gap-4'>
                      {experienceData.map((data, index) => (
                        <ExperienceLevelCard key={index} data={data} />
                      ))}
                    </div>
                  </div>

                  <div className='mt-3 sm:mt-5'>
                    <h5 className='font-bold text-tertiary text-base '>
                      Skills required
                    </h5>

                    <div className='flex md:flex-row flex-col md:gap-x-8 '>
                      <div className='flex sm:flex-row flex-col sm:gap-x-8'>
                        <NumberInput title='Programming' />

                        <NumberInput title='Soft skills' />
                      </div>

                      <div className='mt-2 w-full'>
                        <p className='text-tertiary text-xs font-medium leading-4 '>
                          Certifications
                        </p>
                        <div className='flex sm:flex-row flex-col sm:gap-x-8'>
                          <CustomCheckbox
                            checked={checkboxStates.bachelors}
                            onChange={() => handleCheckboxChange("bachelors")}
                            title="Bachelor's"
                            id='Bachelor'
                          />

                          <CustomCheckbox
                            checked={checkboxStates.masters}
                            onChange={() => handleCheckboxChange("masters")}
                            title="Master's "
                            id='Master'
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='mt-3 sm:mt-5'>
                    <h5 className='font-bold text-tertiary text-base '>PhD</h5>

                    <div className='flex sm:flex-row flex-col sm:gap-x-12 '>
                      <CustomCheckboxTwo
                        checked={checkboxStates.remoteWork}
                        onChange={() => handleCheckboxChange("remoteWork")}
                        title='Remote work'
                        id='remoteWork'
                      />

                      <CustomCheckboxTwo
                        checked={checkboxStates.health}
                        onChange={() => handleCheckboxChange("health")}
                        title='Health'
                        id='health'
                      />

                      <CustomCheckboxTwo
                        checked={checkboxStates.flexible}
                        onChange={() => handleCheckboxChange("flexible")}
                        title='Flexible'
                        id='flexible'
                      />
                    </div>
                  </div>
                </div>

                <div className='modal-form-button-group '>
                  <div>
                    <button className='font-bold text-[#5d5d5b] text-base mt-8 sm:mt-0 '>
                      Reset
                    </button>
                  </div>

                  <div>
                    <button className='modal-search-button '>Search</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
