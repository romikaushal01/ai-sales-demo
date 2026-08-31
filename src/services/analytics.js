import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export async function getAnalytics(period = "all") {
  const { data } = await axios.get(
    `${API}/analytics?period=${period}`
  );

  return data;
}