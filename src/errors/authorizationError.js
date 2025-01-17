const SwollyBaseError = require("./baseError")

/**
 * Thrown when trying to perform an action one is not authorized for (details in message)
 */
class SwollyAuthorizationError extends SwollyBaseError {
    /**
     * Initialize the error with a message.
     * 
     * @param {message} string - The message describing why the error occurred
     * */
    constructor(message) {
        super(message);

        /** @type {string} */
        this.name = 'SwollyAuthorizationError';
    }
}

module.exports = SwollyAuthorizationError
