require('dotenv').config();
const axios = require('axios');
const apiKey = process.env.googleapikey;
const part = `snippet`;

module.exports = async (id) => {
    const response = await axios.get(encodeURI(`https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&part=${part}&id=${id}`));
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
}