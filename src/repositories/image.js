const Repository = require("./repository")
const Image = require("../models/image")
const Errors = require("../errors")
const Enums = require("../enums")
const fs = require("fs")
const path = require('path')
const { v4: uuid } = require('uuid')
const FileType = require('file-type')

/**
 * Repository for all methods relating to images
 */
class ImageRepository extends Repository{
    /**
     *
     * Get a listing of images
     *
     * Authorized Cases:
     * - Caller is Admin
     *
     * @param {string} token - An authentication token for verifying authorization
     *
     * @param {object} [options] An object with options
     *
     * @param {object} [options.filter] Describes how to filter the results
     * @param {string} [options.filter.projectId] Filters result down to images used by this project
     *
     * @param {object} [options.sort] Describes how to sort the results
     * @param {ImageSortField} options.sort.field - The field to sort by
     * @param {SortDirection} options.sort.direction - The direction to sort in
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollySequelizeError}
     */
    async getAll(token, options = {}) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        if(!caller.isAdmin) { 
            throw new Errors.AuthorizationError()
        }

        const result = await this.store.Image.findAll({
            ...(sort != null && {order: [[sort.field, sort.direction]]}),
            ...(filter != null && filter.projectId != null && { include: {
                model: this.store.Project,
                as: "projects",
                through: {
                    where: {
                        ProjectId: filter.projectId
                    }
                }
            }}),
        })

        return result == null ? [] : await Image.createFromArray(result, this.swolly, token, caller)
    })}

    /**
     *
     * Get an image by its id
     *
     * Authorized Cases:
     * - Any registered user
     *
     * @param {string} token - An authentication token for verifying authorization
     * @param {object} id - The id of the requested image
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollySequelizeError}
     */
    async get(token, id) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)
        const result = await this.store.Image.findByPk(id)
        return result == null ? null : await Image.create(result, this.swolly, token, caller)
    })}

    /**
     *
     * Create a new image
     *
     * Authorized Cases:
     * - Any authenticated user
     *
     * @param {string} token - A authentication token for verifying authorization
     * @param {ReadStream} imageStream - The FileStream of the images contents
     *
     * @return {Image}
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyUploadError} Thrown when the upload fails
     * @throws {SwollySequelizeError}
     */
    async create(token, imageStream) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)
        const id = uuid()
        
        if (!(imageStream instanceof fs.ReadStream)) {
            throw new Errors.UploadError("image was not a stream")
        }


        let fileTypeStream
        try {
            const validMimeTypes = ["image/png", "image/jpeg"]
            fileTypeStream = await FileType.stream(imageStream)
            if (!validMimeTypes.includes(fileTypeStream.fileType.mime)) {
                throw new Errors.UploadError("Image was neither a png nor a jpg.")
            }
            const writeStream = fs.createWriteStream(path.join(this.swolly.dataFolder, `${id}.${fileTypeStream.fileType.ext}`))
            fileTypeStream.pipe(writeStream)
        } catch (err) {
            throw new Errors.UploadError(err.message)
        }

        const image = await this.store.Image.create({ id, extension: fileTypeStream.fileType.ext })
        return await Image.create(image, this.swolly, token)
    })}

    async assign(token, id, projectId) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)
        const image = await this.store.Image.findByPk(id)

        if (image == null) {
            throw new Errors.NotFoundError("Image not found")
        }

        const project = await this.store.Project.findByPk(projectId)

        if (project == null) {
            throw new Errors.NotFoundError("Project not found")
        }

        if (await project.countImages() > 9) {
            throw new Error.ValidationError(
                "Too many images (max: 10)",
                Enums.ProjectValidationErrorCode.TOO_MANY_IMAGES
            )
        }

        await project.addImage(image)
    })}

    async unassign(token, id, projectId) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)
        const image = await this.store.Image.findByPk(id)

        if (image == null) {
            throw new Errors.NotFoundError("Image not found")
        }

        const project = await this.store.Project.findByPk(projectId)

        if (project == null) {
            throw new Errors.NotFoundError("Project not found")
        }

        await project.removeImage(image)
    })}
}

module.exports = ImageRepository

