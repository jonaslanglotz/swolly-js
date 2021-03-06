const SwollyBaseError = require("./baseError")

/**
 * Thrown when a connection can not be established or dies (details in message)
 */
class SwollyConnectionError extends SwollyBaseError {
    /**
     * Initialize the error with a message.
     * 
     * @param {message} string - The message describing why the error occurred
     * */
    constructor(message) {
        super(message);

        /** @type {string} */
        this.name = 'SwollyConnectionError';
    }
}

module.exports = SwollyConnectionError
