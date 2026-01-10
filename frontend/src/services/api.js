import axios from 'axios';
const API_BASE_URL = 'http://localhost:8000/api/v1';

let authToken = null;

export const setAuthToken = (token) => {
    authToken = token;
};

const getHeaders = () => {
    if (authToken) {
        return { Authorization: `Bearer ${authToken}` };
    }
    return {};
};

export const fetchLogs = async (tenant, params = {}) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/logs`, {
            params: { tenant, ...params },
            headers: getHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
};

export const fetchSourceStats = async (tenant) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/stats/sources/${tenant}`, {
            headers: getHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching source stats:", error);
        return [];
    }
};

export const fetchTimelineStats = async (tenant) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/stats/timeline/${tenant}`, {
            headers: getHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching timeline stats:", error);
        return [];
    }
};

export const fetchAlerts = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/alerts`, {
            headers: getHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching alerts:", error);
        return [];
    }
};
