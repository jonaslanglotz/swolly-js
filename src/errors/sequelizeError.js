const SwollyBaseError = require("./baseError")

/**
 * Thrown when sequelize throws an unexpected error
 */
class SwollySequelizeError extends SwollyBaseError {
    /**
     * Initialize the error with a message.
     * 
     * @param {message} string - The message describing why the error occurred
     * */
    constructor(message) {
        super(message);

        /** @type {string} */
        this.name = 'SwollySequelizeError';
    }
}

module.exports = SwollySequelizeError

