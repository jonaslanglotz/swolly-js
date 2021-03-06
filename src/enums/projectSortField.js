/**
 * Enum describing fields of {@link Project} by which items may be sorted.
 */
const ProjectSortField = {
    ...require("./sortField"),
    TITLE: "title",
    STATUS: "status",
}

module.exports = ProjectSortField
