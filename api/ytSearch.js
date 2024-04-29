require(`dotenv`).config();
const axios = require(`axios`);
module.exports = ({query, resultType}) => {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.googleapikey;
        const part = `snippet`;
        const maxResults = 1;
        axios.get(encodeURI(`https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=${part}&q=${query}&maxResults=${maxResults}&type=${resultType}`))
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
}