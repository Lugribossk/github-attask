(function () {
    "use strict";
    var util = require("util");
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

    function getCommits(req) {
        var payload;
        if (typeof req.body.payload === "object") {
            payload = req.body.payload;
        } else {
            payload = JSON.parse(req.body.payload);
        }
        return payload.commits;
    }

    function getSessionID(callback) {
        request.get({
            url: baseUrl + "/attask/api/login?username=" + username + "&password=" + password
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var sessionID = JSON.parse(body).data.sessionID;
                console.log("Got session ID " + sessionID);
                callback(sessionID);
            } else {
                console.warn(response.statusCode + ": " + error);
                console.log(util.inspect(response.body));
            }
        });
    }

    function getUpdatedTask(commits) {
        var tasks = [];
        commits.forEach(function (commit) {
            var urlRegex = /attask-ondemand\.com(.*)?ID=(.*)/i;

            var match = urlRegex.exec(commit.message);
            if (match) {
                var path = match[1],
                    id = match[2];

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

    function apiCallback(error, response, body) {
        if (!error && response.statusCode === 200) {
            console.log("Comment posted successfully.");
        } else {
            console.warn(response.statusCode + ": " + error);
        }
    }

    function commentOnTasksInAttask(tasks, sessionID) {
        tasks.forEach(function (task) {
            request.post({
                url: baseUrl + "/update/updateStatus",
                form: {
                    noteText: "Mentioned in " + task.commit.url + " by " + task.commit.author.name + ".",
                    objID: task.id,
                    objCode: task.type,
                    status: "INP",
                    condition: "",
                    isPrivate: false,
                    percentComplete: 0,
                    directUpdateUsers: "",
                    directUpdateTeams: "",
                    sessionID: sessionID
                }
            }, apiCallback);
        });
    }

    exports.index = function (req, res) {
        var commits = getCommits(req);
        var tasks = getUpdatedTask(commits);
        if (tasks.length > 0) {
            getSessionID(function (sessionID) {
                commentOnTasksInAttask(tasks, sessionID);
            });
        }
        res.send("OK");
    };
}());