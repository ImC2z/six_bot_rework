require(`dotenv`).config();
const axios = require(`axios`);

/**
 * Returns id and type of most relevant search result, video or playlist
 * @param {string} query User search
 * @param {(`video`|`playlist`|`video,playlist`)} resultType Type of search result desired
 * @returns {({kind: `youtube#video`, videoId: string}|{kind: `youtube#playlist`, playlistId: string})} ID and type of most relevant search
 */
module.exports = (query, resultType) => {
    return new Promise((resolve, reject) => {
        const queryParams = {
            key: process.env.googleapikey,
            part: `snippet`,
            maxResults: 1,
            q: query,
            type: resultType
        };
        const queryString = Object.entries(queryParams).map(([k, v]) => `${k}=${v}`).join(`&`);
        axios.get(encodeURI(`https://www.googleapis.com/youtube/v3/search?${queryString}`))
        .then(({data}) => {
            const {items} = data
            if(items.length) {
                resolve(items[0].id);
            } else {
                reject(`No result found`);
            }
        })
        .catch(err => {
            // console.log(err);
            reject(err);
        });
    })
};