const path = require('path');
// Delegate directly to the backend script
require(path.join(__dirname, '../backend/scripts/initDb.js'));
