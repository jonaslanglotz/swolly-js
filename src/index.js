const Errors = require("./errors")

module.exports = {
    Swolly: require("./swolly"),
    Errors,

    ...Errors
}
