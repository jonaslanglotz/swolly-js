const Errors = require("./errors")
const Enums = require("./enums")

const Model = require("./models/model")
const Category = require("./models/category")
const Image = require("./models/image")
const Project = require("./models/project")
const Session = require("./models/session")
const Task = require("./models/task")
const User = require("./models/user")

module.exports = {
    Swolly: require("./swolly"),
    Errors,
    Enums,

    Model,
    Category,
    Image,
    Project,
    Session,
    Task,
    User,

    ...Errors
}
