// src/utils/slackChannels.js

const TEAM_TO_CHANNEL = {
  // Short keys without "team" (recommended for clean matching)
  hardware:  'C0AG90SGQKF',   // #hardware-issue
  camera:    'C0AGRASGTPB',   // #camera-issue
  battery:   'C0AGCD05GRY',   // #battery-issue
  display:   'C0AGRATQJQH',   // #display-issue
  support:   'C0AGG1S9LMA',   // #support-team
  
  // Optional: exact matches for what AI is returning (helps reliability)
  'hardware team': 'C0AG90SGQKF',
  'camera team':   'C0AGRASGTPB',
  'battery team':  'C0AGCD05GRY',
  'display team':  'C0AGRATQJQH',
  'support team':  'C0AGG1S9LMA',

  // Fallback channel (used when no match is found)
  default:   'C0AGG1S9LMA',   // ← I suggest using support-team as default
                              // (you can change to any other ID if preferred)
};

module.exports = { TEAM_TO_CHANNEL };