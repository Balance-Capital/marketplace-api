const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Analytics } = require('@segment/analytics-node');

const SEGMENT_ANALYTICS_KEY = process.env.SEGMENT_ANALYTICS_KEY || null;
const segmentAnalytics = new Analytics({ writeKey: SEGMENT_ANALYTICS_KEY });

const EVENT_TYPE_TRACK = 'track';
const EVENT_TYPE_IDENTIFY = 'identify';

const logger = require('./logger');

const analytics = (params) => {
    try {
        const { userId, event, eventMessage, anonymousId} = params;
        if(event === EVENT_TYPE_TRACK) {
            const data = {
                userId,
                event: eventMessage
            };
            if(!userId) {
                data.anonymousId = anonymousId;
                data.userId = undefined;
            };
            segmentAnalytics.track(data);

        };
        if(event === EVENT_TYPE_IDENTIFY) {
            const data = {
                userId,
                traits: {
                name: eventMessage?.name || null,
                email: eventMessage?.email || null
                }
            };
            if(!userId) {
                data.anonymousId = anonymousId;
                data.userId = undefined;
            };
            segmentAnalytics.identify(data);        
        };
    } catch (error) {
        logger.error(error);
    };
}

module.exports = {
    EVENT_TYPE_TRACK,
    EVENT_TYPE_IDENTIFY,
    analytics
}