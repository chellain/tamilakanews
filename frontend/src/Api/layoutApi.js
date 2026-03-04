import api from "./axiosConfig";

export const getLayout = async () => {
  const response = await api.get("/layout");
  return response.data;
};

export const saveLayout = async (payload) => {
  const response = await api.put("/layout", payload);
  return response.data;
};

export const voteOnPoll = async (payload) => {
  const response = await api.post("/layout/polls/vote", payload);
  return response.data;
};
