function sanitize(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
  }
  module.exports = { sanitize };