require('dotenv').config();
const axios = require('axios');
module.exports = ({lat, lng}) => {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.weatherapikey;
        const units = 'metric'
        axios.get(encodeURI(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appId=${apiKey}&units=${units}`))
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
}