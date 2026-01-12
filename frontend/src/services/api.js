import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || ''; 

let authToken = null;

export const setAuthToken = (token) => {
    authToken = token;
};

const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
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

export const loginUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login`, credentials, {
            headers: getHeaders()
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};