// Evaluated once per build: every page in a deploy shares this id, and a new
// deploy changes it. SiteScripts compares ids during client-side navigation
// and forces a full reload when a newer deploy is live — long-lived tabs can
// no longer keep running stale JavaScript forever.
export const BUILD_ID = Date.now().toString(36);
