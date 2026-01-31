import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { axiosInstance, esInstance } from "./axios";
export const callGetApi = async (endpoint, params) => {
  return await axiosInstance
    .get(endpoint, { params })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error("GET Error", error);
      return error;
    });
};

export const callPostApi = async (endpoint, data, config = {}) => {
  console.log('🔍 callPostApi - endpoint:', endpoint, 'config:', config);
  return await axiosInstance
    .post(endpoint, data, config)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error("GET Error", error);
      return error;
    });
};
export const callPostESApi = async (endpoint, data, config = {}) => {
  return await esInstance
    .post(endpoint, data, config)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error("GET Error", error);
      return error;
    });
};
export const callPutApi = async (endpoint, data) => {
  return await axios
    .put(endpoint, data)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error("POST Error", error);
      enqueueSnackbar("Error: " + error, {
        variant: "error",
        autoHideDuration: 3000,
      });
      return error;
    });
};

export const callDeleteApi = async (endpoint) => {
  return await axiosInstance
    .delete(endpoint)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error("POST Error", error);
      enqueueSnackbar("Error: " + error, {
        variant: "error",
        autoHideDuration: 3000,
      });
      return error;
    });
};
