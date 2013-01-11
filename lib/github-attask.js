(function () {
    "use strict";
    var request = require("request");

    var username = encodeURIComponent(process.env.ATTASK_USERNAME),
        password = process.env.ATTASK_PASSWORD,
        domain = process.env.ATTASK_DOMAIN;

    // URI encoding turns undefined into "undefined".
    if (username === "undefined") {
        console.error("ATTASK_USERNAME not set.");
    }
    if (!password) {
        console.error("ATTASK_PASSWORD not set.");
    }
    if (!domain) {
        console.error("ATTASK_DOMAIN not set.");
    }

    var baseUrl = "https://" + domain + ".attask-ondemand.com";

    /**
     * Get the Github commit info from the specified request.
     *
     * @param req
     * @return {Object[]} The commit objects, as defined in https://help.github.com/articles/post-receive-hooks
     */
    function getCommits(req) {
        var payload;
        if (typeof req.body.payload === "object") {
            payload = req.body.payload;
        } else {
            payload = JSON.parse(req.body.payload);
        }
        return payload.commits;
    }

    /**
     * Get an Attask session ID for authenticating other Attask requests.
     *
     * @param {Function} callback The callback to execute with the session ID as parameter
     */
    function getSessionID(callback) {
        request.get({
            url: baseUrl + "/attask/api/login?username=" + username + "&password=" + password
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var sessionID = JSON.parse(body).data.sessionID;
                console.log("Got session ID " + sessionID);
                callback(sessionID);
            } else {
                console.warn("Request error", response.statusCode + ": " + error);
            }
        });
    }

    /**
     * Get a list of the tasks/issues that have been mentioned in the specified commits.
     *
     * @param {Object[]} commits The Github commits.
     * @return {Object[]} A list of tasks
     */
    function getUpdatedTask(commits) {
        var tasks = [];
        commits.forEach(function (commit) {
            var urlRegex = /attask-ondemand\.com(.*?)?ID=([0-9a-f]*)/i;

            var match = urlRegex.exec(commit.message);
            if (match) {
                var path = match[1],
                    id = match[2];

                // We need to determine if this is a task or an issue as Attask seems to require this info when commenting on it.
                // This also means that the commit message must contain the full URL, not just the ID.
                var type;
                if (path.indexOf("/task/") !== -1 || path.indexOf("taskView") !== -1) {
                    type = "TASK";
                } else {
                    type = "ISSUE";
                }

                tasks.push({
                    id: id,
                    type: type,
                    commit: commit
                });
            }
        });

        return tasks;
    }

    /**
     * Add a comment to Attask for each of the specified tasks/issues that links to the commit on Github.
     *
     * @param {Object[]} tasks The tasks
     * @param {String} sessionID The Attask session Id to use.
     */
    function commentOnTasksInAttask(tasks, sessionID) {
        tasks.forEach(function (task) {
            request.post({
                url: baseUrl + "/update/updateStatus",
                form: {
                    noteText: "Mentioned in " + task.commit.url + " by " + task.commit.author.name + ".",
                    objID: task.id,
                    objCode: task.type,
                    status: "INP", // Status is required, so set it to "in progress".
                    condition: "",
                    isPrivate: false,
                    percentComplete: 0,
                    directUpdateUsers: "",
                    directUpdateTeams: "",
                    sessionID: sessionID
                }
            }, function (error, response) {
                if (!error && response.statusCode === 200) {
                    console.log("Comment posted successfully for ID", task.id);
                } else {
                    console.warn("Request error", response.statusCode + ": " + error);
                }
            });
        });
    }

    console.log("Started");

    exports.index = function (req, res) {
        var commits = getCommits(req);
        var tasks = getUpdatedTask(commits);
        console.log("Got", commits.length, "commits with", tasks.length, "tasks.");
        if (tasks.length > 0) {
            getSessionID(function (sessionID) {
                commentOnTasksInAttask(tasks, sessionID);
            });
        }
        res.send("OK");
    };
}());