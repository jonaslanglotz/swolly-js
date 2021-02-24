const { Sequelize, DataTypes } = require("sequelize");
/**
 * Creates a sequelize instance.
 *
 * @param {string}  [connectionURI] The connection URI to be passed through to sequelize.
 * @param {object}  [options] The options to be passed through to sequelize.
 *
 */
async function createStore(connectionURI, options) {
    const sequelize = new Sequelize(connectionURI, options);

    const User = require("../models/user").init({
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        fullname: {
            type: DataTypes.STRING,
            allowNull: false
        },
        mail: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        gender: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
    }, {
        sequelize,
        modelName: "User"
    })


    const Session = require("../models/session").init({
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false
        },
    }, {
        sequelize,
        modelName: "Session"
    })

    const Project = require("../models/project").init({
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "NEEDS_VERIFICATION"
        },
        moneyGoal: {
            type: DataTypes.DECIMAL(13, 2),
            allowNull: false,
            defaultValue: 0
        },
        moneyPledged: {
            type: DataTypes.DECIMAL(13, 2),
            allowNull: false,
            defaultValue: 0
        },
        lat: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0
        },
        lon: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: "Project", 
    })


    const Category = require("../models/category").init({
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
    }, {
        sequelize,
        modelName: "Category"
    })

    const Image = require("../models/image").init({
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true
        }
    }, {
        sequelize,
        modelName: "Image"
    })

    const Task = require("../models/task").init({
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        supporterGoal: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 1
        }
    }, {
        sequelize,
        modelName: "Task"
    })

    User.Sessions = User.hasMany(Session, {
        foreignKey: {
            name: "UserId",
            allowNull: false
        },
        onDelete: "CASCADE",
        as: "sessions"
    })
    Session.User = Session.belongsTo(User, {
        foreignKey: {
            name: "UserId",
            allowNull: false
        },
        onDelete: "CASCADE",
        as: "user"
    })

    User.Projects = User.hasMany(Project, {
        foreignKey: {
            name: "CreatorId",
            allowNull: false
        },
        onDelete: "CASCADE",
        as: "projects"
    })
    Project.Creator = Project.belongsTo(User, {
        foreignKey: {
            name: "CreatorId",
            allowNull: false
        },
        onDelete: "CASCADE",
        as: "creator"
    })

    Category.Projects = Category.hasMany(Project, {
        foreignKey: {
            name: "CategoryId",
        },
        onDelete: "SET NULL",
        as: "projects"
    })
    Project.Category = Project.belongsTo(Category, {
        foreignKey: {
            name: "CategoryId",
        },
        onDelete: "SET NULL",
        as: "category"
    })

    Category.Image = Category.belongsTo(Image, {
        foreignKey: {
            name: "ImageId",
            allowNull: false
        },
        as: "image"
    })

    Project.Tasks = Project.hasMany(Task, {
        foreignKey: {
            name: "ProjectId",
            allowNull: false
        },
        onDelete: "CASCADE",
        as: "tasks"
    })
    Task.Project = Task.belongsTo(Project, {
        foreignKey: {
            name: "ProjectId",
            allowNull: false
        },
        onDelete: "CASCADE",
        as: "project"
    })

    Project.Images = Project.belongsToMany(Image, {
        foreignKey: {
            name: "ImageId",
            allowNull: false
        },
        as: "images",
        through: "ProjectImages"
    })
    Image.Projects = Image.belongsToMany(Project, {
        foreignKey: {
            name: "ProjectId",
            allowNull: false
        },
        as: "projects",
        through: "ProjectImages"
    })

    const TaskSupporters = sequelize.define("TaskSupporters", {
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        application: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: ""
        }

    })

    Task.Supporters = Task.belongsToMany(User, {
        foreignKey: {
            name: "SupporterId",
            allowNull: false
        },
        as: "supporters",
        through: TaskSupporters
    })
    User.SupportedTasks = User.belongsToMany(Task, {
        foreignKey: {
            name: "TaskId",
            allowNull: false
        },
        as: "supportedTasks",
        through: TaskSupporters
    })

    try {
        await sequelize.authenticate()
        await sequelize.sync({alter:true})
        resolve(sequelize)
    } catch (err) {
        reject(err)
    }
}

module.exports = createStore
