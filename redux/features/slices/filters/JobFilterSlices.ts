import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  filterExType: "",
  filter: "",
  updatedFormData: null,
  exp_type: "",
  yoe: 0,
  posted_in_days: undefined
};

//create slice
const jobFilterSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    updateFilters: (state, action) => {
      state = { ...state, ...action.payload };
      return state;
    },
  },
});

export default jobFilterSlice.reducer;

export const { updateFilters } = jobFilterSlice.actions;
