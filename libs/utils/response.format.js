module.exports = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    let data = null;
    let error = null;
    let message = null;

    if (body && typeof body === 'object') {
      if (Object.prototype.hasOwnProperty.call(body, 'data') &&
          Object.prototype.hasOwnProperty.call(body, 'error') &&
          Object.prototype.hasOwnProperty.call(body, 'message')) {
        return originalJson(body);
      }
      if (Object.prototype.hasOwnProperty.call(body, 'data')) data = body.data;
      else data = body;
      if (Object.prototype.hasOwnProperty.call(body, 'error')) error = body.error;
      if (Object.prototype.hasOwnProperty.call(body, 'message')) message = body.message;
    } else if (body !== undefined) {
      data = body;
    }
    return originalJson({ data, error, message });
  };
  next();
};
