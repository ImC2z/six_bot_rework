require(`dotenv`).config();
const axios = require(`axios`);

/**
 * Searches a user-inputted location on Google Maps API and returns location name, address, and coordinates.
 * @param {string} queryLocation User's searched location
 * @returns {Promise<{formatted_address: string, name: string, location: {lat: number, lng: number}}>} Location details
 */
const searchPlaces = (queryLocation) => new Promise((resolve, reject) => {
    const queryParams = {
        key: process.env.googleapikey,
        input: queryLocation,
        inputtype: `textquery`,
        fields: `formatted_address,name,geometry`
    };
    const queryString = Object.entries(queryParams).map(([k, v]) => `${k}=${v}`).join(`&`);
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${queryString}`;
    axios.get(encodeURI(url))
    .then(({data}) => {
        const { candidates } = data;
        if (candidates.length) {
            const { formatted_address, name, geometry } = candidates[0];
            const { location } = geometry;
            resolve({
                formatted_address,
                name,
                location
            });
        } else {
            reject(new Error(`PlacesAPI: No results found.`))
        }
    })
    .catch(err => {
        console.log(err);
        reject(err);
    });
});

module.exports = searchPlaces;