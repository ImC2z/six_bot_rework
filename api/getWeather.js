require('dotenv').config();
const axios = require('axios');

/**
 * Queries OpenWeatherMap API with location coordinates to retrieve location temperature.
 * @param {Object} location Location object containing latitude and longitude
 * @param {number} location.lat Latitude coordinate
 * @param {number} location.lng Longitude coordinate
 * @returns {Promise<{temp: number, feels_like: number, temp_min: number, temp_max: number}>} Temperature data
 */
const getWeather = ({lat, lng}) => {
    return new Promise((resolve, reject) => {
        const queryParams = {
            appId: process.env.weatherapikey,
            lat,
            lon: lng,
            units: `metric`
        };
        const queryString = Object.entries(queryParams).map(([k, v]) => `${k}=${v}`).join(`&`);
        axios.get(encodeURI(`https://api.openweathermap.org/data/2.5/weather?${queryString}`))
            .then(({data}) => {
                //find min max
                if (data.cod === 200) {
                    // const { name: locationName } = data;
                    // const { lat, lon } = data.coord;
                    const { temp, feels_like, temp_min, temp_max } = data.main;
                    resolve({
                        // locationName,
                        // lat,
                        // lon,
                        temp,
                        feels_like,
                        temp_min,
                        temp_max
                    });
                } else {
                    reject(new Error(`Weather API: ${data.message}`));
                }
            })
            .catch(err => {
                reject(err)
            });
    })
};

module.exports = getWeather;