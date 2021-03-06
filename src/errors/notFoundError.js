const SwollyBaseError = require("./baseError")

/**
 * Thrown when a requested resource was not found
 */
class SwollyNotFoundError extends SwollyBaseError {
    /**
     * Initialize the error with a message.
     * 
     * @param {message} string - The message describing why the error occurred
     * */
    constructor(message) {
        super(message);

        /** @type {string} */
        this.name = 'SwollyNotFoundError';
    }
}

module.exports = SwollyNotFoundError

