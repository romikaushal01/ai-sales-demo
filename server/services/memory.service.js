const sessions = {};

function getMemory(sessionId) {
  return sessions[sessionId] || {};
}

function updateMemory(sessionId, filters) {
  sessions[sessionId] = {
    page: 1,
    limit: 5,
    lastResults: [],
    ...getMemory(sessionId),
    ...filters,
  };

  return sessions[sessionId];
}

function clearMemory(sessionId) {
  delete sessions[sessionId];
}

module.exports = {
  getMemory,
  updateMemory,
  clearMemory,
};