import api from "./axios";

export const getScholarships = async () => {
  const res = await api.get("/scholarships");
  return res.data;
};

export const getScholarshipById = async (id: string) => {
  const res = await api.get(`/scholarships/${id}`);
  return res.data;
};
export const getScholarshipSections = async (id: string) => {
  const res = await api.get(`/content/SCHOLARSHIP/${id}/sections`);
  return res.data;
};

export const getScholarshipFaqs = async (id: string) => {
  const res = await api.get(`/content/SCHOLARSHIP/${id}/faqs`);
  return res.data;
};
