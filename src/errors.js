const Errors = {
    AuthorizationError: require("./errors/authorizationError.js"),
    BaseError: require("./errors/baseError.js"),
    ConnectionError: require("./errors/connectionError.js"),
    SequelizeError: require("./errors/sequelizeError.js"),
    NotFoundError: require("./errors/notFoundError.js"),
    ValidationError: require("./errors/validationError.js"),
    UploadError: require("./errors/uploadError.js")
}

module.exports = Errors
