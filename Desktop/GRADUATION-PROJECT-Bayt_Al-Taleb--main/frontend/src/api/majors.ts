// api/majors.ts
import api from "./axios";
export const getMajorById = async (id: string) => {
  const res = await api.get(`/majors/${id}`);
  return res.data;
};

// api/content.ts
export const getMajorSections = async (majorId: string) => {
  const res = await api.get(`/content/MAJOR/${majorId}/sections`);
  return res.data;
};

export const getMajorFaqs = async (majorId: string) => {
  const res = await api.get(`/content/MAJOR/${majorId}/faqs`);
  return res.data;
};
