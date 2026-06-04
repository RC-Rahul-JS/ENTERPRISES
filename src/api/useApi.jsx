
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useLoader } from "../context/LoaderContext";
import { showErrorAlert } from "../utils/alerts";
import Cookies from "js-cookie";

const API_BASE_URL = import.meta.env.VITE_API_URL;
// const token = Cookies.get('token');
const useApi = () => {
  const { showLoader, hideLoader } = useLoader(); // Use global loader
  const getData = useCallback(async (endpoint, config = {}) => {
    console.log(`${API_BASE_URL}${endpoint}`)
    showLoader(); // Show loader when request starts
    const token = Cookies.get('token');
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
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
  const token = Cookies.get('token');
  try {
    const response = await axios.post(`${API_BASE_URL}${endpoint}`, postData, {
      headers: {
        "Content-Type": "application/json",
        // "Authorization":`Bearer ${token}`,
        // 'ngrok-skip-browser-warning': 'true',
        'x-api-key':'1234',
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
    console.log(`${API_BASE_URL}${endpoint}`, postData);
    try {
      const response = await axios.patch(`${API_BASE_URL}${endpoint}`, postData, {
        headers: {
          "Content-Type": "application/json",
          // 'ngrok-skip-browser-warning': 'true',
          "x-api-key" : "1234",
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

  return { getData, postData ,UpdateData };
};

export default useApi;

