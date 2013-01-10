github-attask
============

GitHub integration for AtTask.

Based on https://github.com/jamieforrest/github-asana

Installation
============
TODO

ATTASK_USERNAME, ATTASK_PASSWORD, ATTASK_DOMAIN.

You need need to set the `ASANA_KEY` environment variable to your [Asana API Key].

Once that's set, git-asana depends on express.js and require.js. To get started locally:  
* git clone https://github.com/jamieforrest/github-asana.git  
* cd github-asana  
* npm install  
* node app.js  


To run on Heroku is even easier:
* git clone https://github.com/jamieforrest/github-asana.git
* cd github-asana
* heroku create -s cedar
* git push heroku master
* heroku config:add ASANA_KEY=<your_api_key_here>

Once you have this hosted, you need to set up GitHub's Service Hook.  Go to your repositories "Admin",
then click "Service Hooks" followed by "WebHook URLs".  Add a URL for your newly hosted server.
`github-asana` responds to POST requests at the root (or `/`) of the URL where your app is hosted.

Commit Syntax
=============
When committing, put the full URL of the Attask task or issue in the commit message.