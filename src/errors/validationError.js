const SwollyBaseError = require("./baseError")

/**
 * Thrown when an object is validated and a condition is not matched
 */
class SwollyValidationError extends SwollyBaseError {
    /**
     * Initialize the error with a message.
     * 
     * @param {string} message - The message describing why the error occurred
     * @param {string} code - The code describing why the error occurred
     * */
    constructor(message, code) {
        super(message);

        /** @type {string} */
        this.code = code;

        /** @type {string} */
        this.name = 'SwollyValidationError';
    }
}

module.exports = SwollyValidationError

