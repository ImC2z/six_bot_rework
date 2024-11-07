require('dotenv').config();
const axios = require('axios');

/**
 * Takes a video ID and retrieves title and URL.
 * @param {string} id ID of video from which details are wanted
 * @returns {{title: string, url: string}} Video details object
 * @throws Will throw error if no video with specified ID is found
 */
const getVidDetails = async (id) => {
    const queryParams = {
        key: process.env.googleapikey,
        part: `snippet`,
        id: id
    };
    const queryString = Object.entries(queryParams).map(([k, v]) => `${k}=${v}`).join(`&`);
    const response = await axios.get(encodeURI(`https://www.googleapis.com/youtube/v3/videos?${queryString}`));
    const {items} = response.data;
    if (items.length) {
        const videoData = items[0];
        return {
            title: videoData.snippet.title,
            url: `https://youtu.be/${videoData.id}`
        };
    } else {
        throw `getVidDetails.js: Video not found`;
    }
};

module.exports = getVidDetails;