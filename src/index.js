const Errors = require("./errors")
const Enums = require("./enums")

module.exports = {
    Swolly: require("./swolly"),
    Errors,
    Enums,

    ...Errors
}
