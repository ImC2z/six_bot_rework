const { ActivityType } = require(`discord.js`);

const ownerId = `462200925973381124`;
const musicApps = [`Spotify`];

class Presences {
    constructor({client}) {
        this.client = client;
    }

    onReady() {
        this.client.user.setActivity({ type: ActivityType.Playing, name: `with Mono` });
    }

    onPresenceUpdate(oldPresence, newPresence) {
        const pastActivities = oldPresence && oldPresence.activities, currentActivities = newPresence.activities;
        // const wanted = [`name`, `details`, `state`, `assets`, `applicationId`];
        // const filteredProps = (activity) => {
        //     return Object.keys(activity)
        //     .filter(key => wanted.includes(key))
        //     .reduce((result, key) => {
        //         result[key] = activity[key];
        //         return result;
        //     }, {});
        // }
        if (pastActivities !== currentActivities) {
            // console.log(newPresence.user.username + `:`);
            // console.log(currentActivities.map(activity => filteredProps(activity)));
            if (newPresence.user.id === ownerId) {
                this.onOwnerUpdate(currentActivities);
            }
        }
    }

    onOwnerUpdate(activities) {
        const watchable = activities.filter(activity => !!activity.applicationId);
        const listenable = activities.filter(activity => musicApps.includes(activity.name));
        this.client.user.setActivity(
            watchable.length ? 
            { type: ActivityType.Watching, name: `her dad play ${watchable[0].name}` } : 
            listenable.length ? 
            { type: ActivityType.Listening, name: `${listenable[0].name} with her dad` } : 
            { type: ActivityType.Playing, name: `with Mono` }
        );
    }
}

module.exports = Presences;