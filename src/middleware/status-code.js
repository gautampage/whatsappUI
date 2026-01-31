const verifyStatusCode = (status) => {
  if (status >= 100 && status < 200) {
    return "info";
  } else if (status >= 200 && status < 300) {
    return "success";
  } else if (status >= 300 && status < 400) {
    return "success";
  } else if (status >= 400 && status < 500) {
    return "error";
  } else if (status >= 500 && status < 600) {
    return "error";
  }
  return "warn";
};
export default verifyStatusCode;
