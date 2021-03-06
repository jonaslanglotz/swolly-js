/**
 * Enum describing fields of {@link Task} by which items may be sorted.
 */
const TaskSortField = {
    ...require("./sortField"),
    TITLE: "title",
    STATUS: "status",
    SUPPORTER_GOAL: "supporterGoal",
}

module.exports = TaskSortField
