class LoginResponseDTO {
    constructor(id, name, email,password, token) {
      this.id = id; // number
      this.name = name; // String 
      this.email = email; // Dynamic
      this.password=password;
      this.token=token;
    }
  }
  
  module.exports = LoginResponseDTO;