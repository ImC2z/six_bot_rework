require(`dotenv`).config();
const axios = require(`axios`);

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
    })
});

module.exports= searchPlaces;