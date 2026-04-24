//services/healthService.js - Buisness logic for the health check can be expanded here in the future if needed.
// Service → handles logic and data manipulation.
export function getHealth() {
  return { message: "GET working 🚀" };
}

export function createHealth(data) {
  return {
    message: "POST working ✅",
    receivedData: data
  };
}