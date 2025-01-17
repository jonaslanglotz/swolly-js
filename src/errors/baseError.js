/**
 * All swolly errors inherit from this BaseError, which itself inherits from the basic JS error.
 */
class SwollyBaseError extends Error {
    /**
     * Initialize the error with a message.
     * 
     * @param {message} string - The message describing why the error occurred
     * */
    constructor(message) {
        super(message);

        /** @type {string} */
        this.name = 'SwollyBaseError';
    }
}

module.exports = SwollyBaseError
