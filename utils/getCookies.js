const getCookies = (request) => {
    const cookies = {};
    if(request?.headers && request?.headers?.cookie) {
      request.headers.cookie.split(';').forEach((cookie) => {
        const parts = cookie.match(/(.*?)=(.*)$/)
        cookies[ parts[1].trim() ] = (parts[2] || '').trim();
      });  
    }
    return cookies;
};

module.exports = getCookies