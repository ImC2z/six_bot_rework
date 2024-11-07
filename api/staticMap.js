/**
 * Takes a location coordinate pair object and returns a map thumbnail URL of requested location.
 * @param {Object} location Location object containing latitude and longitude
 * @param {number} location.lat Latitude coordinate
 * @param {number} location.lng Longitude coordinate
 * @returns {string} URL of generated map thumbnail
 */
const staticMap = ({lat, lng}) => {
    const queryParams = {
        key: process.env.googleapikey,
        center: `${lat},${lng}`,
        zoom: 14,
        size: `512x512`
    };
    const queryString = Object.entries(queryParams).map(([k, v]) => `${k}=${v}`).join(`&`);
    const mapThumbnailURL = `https://maps.googleapis.com/maps/api/staticmap?${queryString}`;
    return mapThumbnailURL;
}

module.exports = staticMap;