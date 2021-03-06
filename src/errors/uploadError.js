const SwollyBaseError = require("./baseError")

/**
 * Thrown when an upload fails
 */
class SwollyUploadError extends SwollyBaseError {
    /**
     * Initialize the error with a message.
     * 
     * @param {message} string - The message describing why the error occurred
     * */
    constructor(message) {
        super(message);

        /** @type {string} */
        this.name = 'SwollyUploadError';
    }
}

module.exports = SwollyUploadError

