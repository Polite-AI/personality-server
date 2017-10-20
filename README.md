# Personality Server

This will serve the bots in an internal API, allowing for bots from other platforms to be very thin layers which 'translate' to this server.

## Library documentation
[Class Library Documentation][36f6b0c5]

  [36f6b0c5]: docs.md "Docs"

## Installation

You will need to edit config.js to include details of your Postgres database credentials.

For dev purposes:
`createuser <username> --pwprompt`

followed by:
`createdb <databasename> --owner=<username>`

Should suffice.

For production use, the code shouldn't of course have owner access to the database and instead should have table access permissions as required but for development on isolated systems this is OK.

The database schema is then created using:

> CAUTION: The command below will drop the entire contents of your database and create a new empty one. Use with care!
>

`psql -U <username> <databasename> -f scripts/schema.sql`

## Testing

Run: `npm test` to execute all unit tests (currently database only)

Individual tests can be run with `tap tests/<module>.test.js`
