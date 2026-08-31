// Canonical axios instance lives in ../services/api.js (Part 1's original
// location, still used by authService/userService). Re-exported here so
// every other part's API modules can `import api from "../api/http"`
// without caring which part originally owned the file.
export { default, TOKEN_KEY } from "../services/api";
