const sessions = {};

function getMemory(sessionId) {
  return sessions[sessionId] || {};
}

function updateMemory(sessionId, filters) {
  sessions[sessionId] = {
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