const request = require("request");

const geocode = function (address) {
  const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${address}&category=&outFields=*&forStorage=false&f=pjson`;
  return new Promise((resolve, reject) => {
    request.get({ url, json: true }, (error, response, body) => {
      if (error) {
        return reject(error);
      } else {
        resolve(body.candidates[0]);
      }
    });
  });
};

module.exports = geocode;
