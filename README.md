# Personality Server

This server provides an internal REST API, allowing for bots that become very thin layers which 'translate' to this server.

## REST API

[REST API Docs][48471aa0]

## Library documentation
[Class Library Documentation][36f6b0c5]

  [36f6b0c5]: docs.md "Docs"
  [48471aa0]: RESTAPI.md "REST API Docs"

## Requirements

Only currently tested in UNIX like environments (Debian/Ubuntu Linux, Mac OS X etc), fairly vanilla Node/Postgres stack but may present challenges in Windows etc environments.

* Node 8.0+
* Postgres 9.4+ (also required Postgres crypto extensions which are built separately as postgresql-contrib in many distributions)


## Installation

### Database

Two deployment options:
* Database `owner` user both creates and owns the database schema and credentials used by server to access database.
* Separate `owner` and `access-user` database users where `owner` can create and modify database `access-user` credentials used by server to create/destroy data only (can't change schema).

The former is more convenient as the database.js class contains code to dynamically update the schema to the level required by the current code. This is useful during development when the code and schema may change frequently and the database schema will be updated the first time newly checked out code upgrades are run.

It isn't however good practice to use owner credentials for running production services and we recommend you separate the two roles on live production instances.

If you wish to use a single owner user:

`createuser <username> --pwprompt`

followed by:

`createdb <databasename> --owner=<username>`

The initial database schema is then created using:

> CAUTION: The command below will drop the entire contents of your database and create a new empty one. Use with care!
>

`psql -U <username> <databasename> -f scripts/schema.sql`

If you use separate roles for database access than create a role and give it read/write/delete priviledge on all of the tables and sequences in the database. In this case, you should watch the console output on server start after an upgrade as you may need to perform a manual schema update using the commands that will be output on the console.

### config.js

Copy config.js.example to config.js and customise with your local database information from the above steps.
## Testing

Run: `npm test` to execute all unit tests (currently database only)

Individual tests can be run with `tap tests/<module>.test.js`

## Running

`node index.js` starts the express server instance
