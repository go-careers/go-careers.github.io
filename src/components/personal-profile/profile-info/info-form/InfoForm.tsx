import React, { ChangeEvent, useState } from "react";

interface InfoFormProps {}

const InfoForm: React.FC<InfoFormProps> = () => {
  // State variables for holding user information
  const [fullName, setFullName] = useState<string>("John Doe");
  const [locationData, setLocationData] = useState<string>("New York, USA");
  const [emailData, setEmailData] = useState<string>("johndoe@example.com");
  const [nationalityData, setNationalityData] = useState<string>("American");
  const [birthDate, setBirthDate] = useState<string>("1990-01-01");

  // State variables for managing edit mode
  const [isEditingFullName, setIsEditingFullName] = useState<boolean>(false);
  const [isEditingLocation, setIsEditingLocation] = useState<boolean>(false);
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [isEditingNationality, setIsEditingNationality] =
    useState<boolean>(false);
  const [isEditingBirthDate, setIsEditingBirthDate] = useState<boolean>(false);

  // State variables for holding temporary values during editing
  const [tempFullName, setTempFullName] = useState<string>("");
  const [tempLocationData, setTempLocationData] = useState<string>("");
  const [tempEmailData, setTempEmailData] = useState<string>("");
  const [tempNationalityData, setTempNationalityData] = useState<string>("");
  const [tempBirthDate, setTempBirthDate] = useState<string>("");

  // Functions to handle edit actions for each field
  const handleEditFullName = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsEditingFullName(true);
    setTempFullName(fullName);
  };

  const handleEditLocation = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsEditingLocation(true);
    setTempLocationData(locationData);
  };

  const handleEditEmail = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsEditingEmail(true);
    setTempEmailData(emailData);
  };

  const handleEditNationality = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsEditingNationality(true);
    setTempNationalityData(nationalityData);
  };

  const handleEditBirthDate = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsEditingBirthDate(true);
    setTempBirthDate(birthDate);
  };

  // Functions to handle save actions for each field
  const handleSaveFullName = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setFullName(tempFullName);
    setIsEditingFullName(false);
  };

  const handleSaveLocation = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLocationData(tempLocationData);
    setIsEditingLocation(false);
  };

  const handleSaveEmail = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setEmailData(tempEmailData);
    setIsEditingEmail(false);
  };

  const handleSaveNationality = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setNationalityData(tempNationalityData);
    setIsEditingNationality(false);
  };

  const handleSaveBirthDate = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setBirthDate(tempBirthDate);
    setIsEditingBirthDate(false);
  };

  // Functions to handle changes in temporary values during editing
  const handleChangeFullName = (e: ChangeEvent<HTMLInputElement>) => {
    setTempFullName(e.target.value);
  };

  const handleChangeLocation = (e: ChangeEvent<HTMLInputElement>) => {
    setTempLocationData(e.target.value);
  };

  const handleChangeEmail = (e: ChangeEvent<HTMLInputElement>) => {
    setTempEmailData(e.target.value);
  };

  const handleChangeNationality = (e: ChangeEvent<HTMLInputElement>) => {
    setTempNationalityData(e.target.value);
  };

  const handleChangeBirthDate = (e: ChangeEvent<HTMLInputElement>) => {
    setTempBirthDate(e.target.value);
  };

  // JSX rendering with input fields and buttons for each piece of information
  return (
    <>
      <form>
        {/* Full Name Text Field */}
        <div className='flex justify-between'>
          <div className='flex '>
            <label htmlFor='FullName' className='profile-inputs-labels'>
              Full name
            </label>
            {isEditingFullName ? (
              <input
                type='text'
                name='fullName'
                id='FullName'
                value={tempFullName}
                onChange={handleChangeFullName}
                className='profile-editable-inputs'
              />
            ) : (
              <input
                type='text'
                name='fullName'
                id='FullName'
                value={fullName}
                className='profile-read-inputs'
                readOnly
              />
            )}
          </div>

          {/* Conditional rendering of buttons based on edit mode or save mode */}
          {isEditingFullName ? (
            <button
              className='profile-buttons-group '
              onClick={(e) => handleSaveFullName(e)}>
              Save
            </button>
          ) : (
            <button
              className='profile-buttons-group'
              onClick={(e) => handleEditFullName(e)}>
              Edit
            </button>
          )}
        </div>

        {/* Location text field */}
        <div className='flex justify-between mt-[20px] '>
          <div className='flex'>
            <label htmlFor='Location' className='profile-inputs-labels'>
              Location
            </label>
            {isEditingLocation ? (
              <input
                type='text'
                name='location'
                id='Location'
                value={tempLocationData}
                onChange={handleChangeLocation}
                className='profile-editable-inputs'
              />
            ) : (
              <input
                type='text'
                name='location'
                id='Location'
                value={locationData}
                className='profile-read-inputs'
                readOnly
              />
            )}
          </div>

          {/* Conditional rendering of buttons based on edit mode or save mode */}
          {isEditingLocation ? (
            <button
              className='profile-buttons-group'
              onClick={handleSaveLocation}>
              Save
            </button>
          ) : (
            <button
              className='profile-buttons-group'
              onClick={handleEditLocation}>
              Edit
            </button>
          )}
        </div>

        {/* Email field */}
        <div className='flex justify-between mt-[20px]'>
          <div className='flex'>
            <label htmlFor='Email' className='profile-inputs-labels'>
              Email
            </label>

            {isEditingEmail ? (
              <input
                type='email'
                name='email'
                id='Email'
                value={tempEmailData}
                onChange={handleChangeEmail}
                className='profile-editable-inputs'
              />
            ) : (
              <input
                type='email'
                name='email'
                id='Email'
                value={emailData}
                className='profile-read-inputs'
                readOnly
              />
            )}
          </div>

          {/* Conditional rendering of buttons based on edit mode or save mode */}
          {isEditingEmail ? (
            <button className='profile-buttons-group' onClick={handleSaveEmail}>
              Save
            </button>
          ) : (
            <button className='profile-buttons-group' onClick={handleEditEmail}>
              Edit
            </button>
          )}
        </div>

        {/* Nationality field */}
        <div className='flex justify-between mt-[20px] '>
          <div className='flex'>
            <label htmlFor='Nationality' className='profile-inputs-labels'>
              Nationality
            </label>
            {isEditingNationality ? (
              <input
                type='text'
                name='nationality'
                id='Nationality'
                value={tempNationalityData}
                onChange={handleChangeNationality}
                className='profile-editable-inputs'
              />
            ) : (
              <input
                type='text'
                name='nationality '
                id='Nationality '
                value={nationalityData}
                className='profile-read-inputs'
                readOnly
              />
            )}
          </div>

          {/* Conditional rendering of buttons based on edit mode or save mode */}
          {isEditingNationality ? (
            <button
              className='profile-buttons-group'
              onClick={handleSaveNationality}>
              Save
            </button>
          ) : (
            <button
              className='profile-buttons-group'
              onClick={handleEditNationality}>
              Edit
            </button>
          )}
        </div>

        {/* Date of birth field */}
        <div className='flex justify-between mt-[20px] '>
          <div className='flex'>
            <label htmlFor='DateOfBirth' className='profile-inputs-labels'>
              Date of birth
            </label>
            {isEditingBirthDate ? (
              <input
                type='date'
                name='dateOfBirth'
                id='DateOfBirth'
                value={tempBirthDate}
                onChange={handleChangeBirthDate}
                className='profile-editable-inputs'
              />
            ) : (
              <input
                type='date'
                name='dateOfBirth'
                id='DateOfBirth'
                value={birthDate}
                className='profile-read-inputs'
                readOnly
              />
            )}
          </div>

          {/* Conditional rendering of buttons based on edit mode or save mode */}
          {isEditingBirthDate ? (
            <button
              className='profile-buttons-group'
              onClick={handleSaveBirthDate}>
              Save
            </button>
          ) : (
            <button
              className='profile-buttons-group'
              onClick={handleEditBirthDate}>
              Edit
            </button>
          )}
        </div>
      </form>
    </>
  );
};

export default InfoForm;
