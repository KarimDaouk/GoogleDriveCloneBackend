class ApiResponse {
    constructor(statusCode, message, data) {
      this.status = statusCode; // number
      this.message = message; // String 
      this.data = data; // Dynamic
    }
  }
  
  module.exports = ApiResponse;