import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:3001/api",
});
export const login = (credenetials) =>
  api.post("/user/login", credenetials).then((res) => res.data);

export const registerAdmin = (credenetials) =>
  api.post("/user/register", credenetials).then((res) => res.data);
