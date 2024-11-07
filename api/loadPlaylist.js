require('dotenv').config();
const axios = require('axios');
const apiKey = process.env.googleapikey;
const part = 'snippet'
const maxResults = 50

/**
 * Takes a YT playlist ID and retrieves details of all videos within.
 * @param {string} listId ID of YT playlist
 * @returns {{title: string, url: string}[]} Array of video details
 * @throws Will throw error if e.g. playlist with ID is not found
 */
const loadPlaylist = listId => chainLoad(listId, ``);

/**
 * Recursive helper function that builds whole array of playlist items, 50 at a time.
 * @param {string} listId ID of YT playlist
 * @param {string} pageToken Token to retrieve further items if playlist has more than 50 items
 * @returns {{title: string, url: string}[]} Array of video details
 * @throws Will throw error if e.g. playlist with ID is not found
 */
const chainLoad = async (listId, pageToken) => {
    const queryParams = {
        apiKey: process.env.googleapikey,
        part: `snippet`,
        maxResults: 50,
        pageToken: pageToken,
        playlistId: listId
    };
    const queryString = Object.entries(queryParams).map(([k, v]) => `${k}=${v}`).join(`&`);
    try {
        const response = await axios.get(encodeURI(`https://www.googleapis.com/youtube/v3/playlistItems?${queryString}`));
        const {items, nextPageToken} = response.data;
        const videosData = items.map(videoData => {
            return {
                title: videoData.snippet.title,
                url: `https://youtu.be/${videoData.snippet.resourceId.videoId}`
            };
        });
        if (!!nextPageToken) {
            return [
                ...videosData,
                ...chainLoad(listId, nextPageToken)
            ];
        }
        return videosData;
    }
    catch (err) {
        throw err;
    }
};

module.exports = loadPlaylist;