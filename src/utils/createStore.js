const { Sequelize, DataTypes } = require("sequelize");
/**
 * Creates a sequelize instance.
 *
 * @param {string}  [connectionURI] The connection URI to be passed through to sequelize.
 * @param {object}  [options] The options to be passed through to sequelize.
 * @param {boolean}  [alter] If sequelize should alter the database.
 *
 */
async function createStore(connectionURI, options, alter) {
    const sequelize = new Sequelize(connectionURI, options);

    const User = sequelize.define("User", {
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
    })

    const Session = sequelize.define("Session", {
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
    })

    const Project = sequelize.define("Project", {
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
    })


    const Category = sequelize.define("Category", {
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
    })

    const Image = sequelize.define("Image", {
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        extension: {
            type: DataTypes.STRING,
            defaultValue: "",
            allowNull: false,
        }
    })

    const Task = sequelize.define("Task", {
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
        supporterGoal: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 1
        }
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

    const Application = sequelize.define("Application", {
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: ""
        },
        accepted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }

    })

    Task.belongsToMany(User, {
        foreignKey: {
            name: "TaskId",
            allowNull: false
        },
        through: Application,
        as: "supporters"
    })
    User.belongsToMany(Task, {
        foreignKey: {
            name: "UserId",
            allowNull: false
        },
        through: Application,
        as: "supportedTasks"
    })

    Task.Applications = Task.hasMany(Application, {
        foreignKey: {
            name: "TaskId",
            allowNull: false
        },
        onDelete: "CASCADE",
        as: "applications",
    })

    Application.Task = Application.belongsTo(Task, {
        foreignKey: {
            name: "TaskId",
            allowNull: false
        },
        as: "task",
    })

    User.Applications = User.hasMany(Application, {
        foreignKey: {
            name: "UserId",
            allowNull: false
        },
        onDelete: "CASCADE",
        as: "applications",
    })

    Application.User = Application.belongsTo(User, {
        foreignKey: {
            name: "UserId",
            allowNull: false
        },
        as: "user",
    })

    await sequelize.authenticate()
    await sequelize.sync({alter})
    return sequelize
}

module.exports = createStore
