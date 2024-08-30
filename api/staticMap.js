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