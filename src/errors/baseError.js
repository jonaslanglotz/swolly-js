/**
 * All swolly errors inherit from this BaseError, which itself inherits from the basic JS error.
 */
class BaseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SwollyBaseError';
    }
}

module.exports = BaseError;
