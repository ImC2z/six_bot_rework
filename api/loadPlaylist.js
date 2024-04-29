require('dotenv').config();
const axios = require('axios');
const apiKey = process.env.googleapikey;
const part = 'snippet'
const maxResults = 50

const loadPlaylist = listId => chainLoad(listId, ``);

const chainLoad = async (listId, pageToken) => {
    try {
        const response = await axios.get(
            encodeURI(`https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&part=${part}&playlistId=${listId}&pageToken=${pageToken}&maxResults=${maxResults}`)
        );
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
                ...await chainLoad(listId, nextPageToken)
            ];
        }
        return videosData;
    }
    catch (err) {
        throw err;
    }
}

module.exports = loadPlaylist;