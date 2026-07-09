import posthog from 'posthog-js';

export const track = (event, props = {}) => posthog.capture(event, props);

export const identify = (userId, props = {}) => posthog.identify(userId, props);
