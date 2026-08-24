
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useLoader } from "../context/LoaderContext";
import { showErrorAlert } from "../utils/alerts";
import Cookies from "js-cookie";

const API_BASE_URL = import.meta.env.VITE_LOCALPRIME_URL || 'https://api.care2connect.in/badri_enterprises/localprime';
const API_URL_NO_LOCALPRIME = import.meta.env.VITE_API_URL || 'https://api.care2connect.in/badri_enterprises';
// const token = Cookies.get('token');

const useApi = () => {
  const { showLoader, hideLoader } = useLoader(); // Use global loader

  const getBaseUrl = (endpoint) => {
    // Request specifically for login removes localprime
    return endpoint === '/trade/login' ? API_URL_NO_LOCALPRIME : API_BASE_URL;
  };

  const getData = useCallback(async (endpoint, config = {}) => {
    const baseUrl = getBaseUrl(endpoint);
    console.log(`${baseUrl}${endpoint}`)
    showLoader(); // Show loader when request starts
    const token = Cookies.get('token');
    try {
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        timeout: 15000,
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${token}`,
        },
        ...config,
      });
      console.log(response.data);
      return response.data;
    } catch (err) {
      const errorData = err.response?.data || { message: err.message };
      console.error("API Error:", errorData);
      // Show error alert here or let component handle it
      // showErrorAlert("Error", errorData.error || "Something went wrong!");
      // Re-throw error so component can catch it
      throw errorData;
    } finally {
      hideLoader(); // Hide loader when request ends
    }
  }, []);

  const postData = async (endpoint, postData, config = {}) => {
    showLoader();
    const baseUrl = getBaseUrl(endpoint);
    const token = Cookies.get('token');
    try {
      const response = await axios.post(`${baseUrl}${endpoint}`, postData, {
        headers: {
          "Content-Type": "application/json",
          // "Authorization":`Bearer ${token}`,
          // 'ngrok-skip-browser-warning': 'true',
          'x-api-key': '1234',
          ...config.headers,
        },
        timeout: 15000,
        ...config,
      });
      console.log(response);
      return response.data;
    } catch (err) {
      const errorData = err.response?.data || { message: err.message };
      console.error("API Error:", errorData);
      // Show error alert here or let component handle it
      // showErrorAlert("Error", errorData.error||errorData.message || "Something went wrong!");
      // Re-throw error so component can catch it
      throw errorData;
    } finally {
      hideLoader();
    }
  };


  const UpdateData = async (endpoint, postData, config = {}) => {
    showLoader(); // Show loader when request starts
    const baseUrl = getBaseUrl(endpoint);
    console.log(`${baseUrl}${endpoint}`, postData);
    try {
      const response = await axios.patch(`${baseUrl}${endpoint}`, postData, {
        headers: {
          "Content-Type": "application/json",
          // 'ngrok-skip-browser-warning': 'true',
          "x-api-key": "1234",
          ...config.headers,
        },
        timeout: 10000,
        ...config,
      });
      console.log(response.data);
      return response.data;
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
    } finally {
      hideLoader(); // Hide loader when request ends
    }
  };

  return { getData, postData, UpdateData };
};

export default useApi;
