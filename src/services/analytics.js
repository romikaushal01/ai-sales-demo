import axios from "axios";

const API = "http://localhost:5000";

export async function getAnalytics(period = "all") {
  const { data } = await axios.get(
    `${API}/analytics?period=${period}`
  );

  return data;
}