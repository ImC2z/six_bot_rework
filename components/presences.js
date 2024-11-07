const { ActivityType, Presence, Client, Activity } = require(`discord.js`);

const ownerId = `462200925973381124`;
const musicApps = [`Spotify`];

/**
 * Monitors owner's presence and updates own presence accordingly.
 */
class Presences {
    /**
     * @param {Client} client Bot client
     */
    constructor(client) {
        this.client = client;
        this.onPresenceUpdate = this.onPresenceUpdate.bind(this);
    }

    /**
     * Initializes bot default presence.
     */
    onReady() {
        this.client.user.setActivity({ type: ActivityType.Playing, name: `with Mono` });
    }

    /**
     * Event handler monitors owner's presence in case of update.
     * @param {Presence} oldPresence Original presence of user
     * @param {Presence} newPresence Updated presence of user
     */
    onPresenceUpdate(oldPresence, newPresence) {
        const pastActivities = oldPresence && oldPresence.activities, currentActivities = newPresence.activities;
        if (pastActivities !== currentActivities && newPresence.user.id === ownerId) {
            this.onOwnerUpdate(currentActivities);
        }
    }

    /**
     * Triggers when owner presence update is detected
     * @param {Activity[]} activities Array of user's current activities.
     */
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