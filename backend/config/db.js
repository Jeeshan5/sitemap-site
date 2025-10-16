// This file can remain nearly empty since server.js handles the connection logic.
// You might put functions for connection status or complex connection options here later.

module.exports = {
    // Example: exporting the DB URI might be useful in other parts of the app
    getUri: () => process.env.MONGODB_URI
};