import api from "./axios";

export const getColleges = async () => {
  const res = await api.get("/colleges");
  return res.data;
};

export const getCollegeById = async (id: string) => {
  const res = await api.get(`/colleges/${id}`);
  return res.data;
};
export const getCollegeMajors = async (id: string) => {
  const res = await api.get(`/colleges/${id}/majors`);
  return res.data;
};
