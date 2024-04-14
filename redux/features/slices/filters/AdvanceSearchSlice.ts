// advanceSearchSlice.js

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  title: "",
  job_location: "",
  job_type: "",
  emp_type: "",
  min_exp: 0,
  max_exp: 0,
};

const advanceSearchSlice = createSlice({
  name: "advanceSearch",
  initialState,
  reducers: {
    updateFormState(state, action) {
      return { ...state, ...action.payload };
    },
    resetFormState() {
      return initialState;
    },
  },
});

export const { updateFormState, resetFormState } = advanceSearchSlice.actions;
export default advanceSearchSlice.reducer;
