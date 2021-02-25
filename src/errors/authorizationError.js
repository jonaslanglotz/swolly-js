const BaseError = require("./baseError")

/**
 * Thrown when trying to perform an action one could not be authorized for (details in message)
 */
class AuthorizationError extends BaseError {
    constructor(message) {
        super(message);
        this.name = 'SwollyAuthorizationError';
    }
}

module.exports = BaseError;

