import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const fetchLogs = async (tenant, params = {}) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/logs`, {
            params: { tenant, ...params }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
};

export const fetchSourceStats = async (tenant) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/stats/sources/${tenant}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching source stats:", error);
        return [];
    }
};

export const fetchTimelineStats = async (tenant) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/stats/timeline/${tenant}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching timeline stats:", error);
        return [];
    }
};
