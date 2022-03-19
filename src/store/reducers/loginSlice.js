import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoading: false,
  isAuth: false,
  isError: false,
  user: {},
};

export const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
    },
    loginSuccess: (state, { payload }) => {
      state.isLoading = false;
      state.isAuth = true;
      state.user = payload;
    },
    loginFailure: (state, { payload }) => {
      state.isLoading = false;
      state.isError = payload;
    },
    updateUser: (state, { payload }) => {
      state.user = payload;
      state.isAuth = true;
    },
    logout: (state) => {
      state.isAuth = false;
    },
  },
});

// Action creators are generated for each case reducer function
export const { loginStart, loginSuccess, loginFailure, updateUser, logout } =
  loginSlice.actions;

export default loginSlice.reducer;
