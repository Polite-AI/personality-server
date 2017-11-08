## REST API version 1.0 documentation

# Process an inbound message

**URL** : `/${apiVersion}/message/:classifier/:language/:personality`

**URL Parameters** : `classifier=[string]`, `:language=[string]`, `:personality=[string]`. Where `classifier` is the name of the classifier (defaults to 'wiki-detox'), `language` is the natural language (defaults to 'english'), and `personality` is the bot personality (defaults to 'standard' a neutral, factual expression).

**Method** : `POST`

**Auth required** : NO

**Data**: `{
  text,
  provider,
  roomId,
  eventId,
  userId,
  eventTime
}`

## Success Response

**Condition** : If message is well formed and it has either been seen before (already exists in the database), or is new and has been classified and inserted.

**Code** : `200 OK`

**Content example**

```json
{
    "status": "OK",
    "triggered": false,
}```

```json
{
    "status": "seenBefore",
    "triggered": false,
}```

```json
{
    "status": "OK",
    "triggered": true,
    "response": "hey @user that comment was a little aggressive"
}```

## Error Responses

**Condition** : If the message data is malformed such that the message can neither be identified in the database of seen messages nor injected as a new one (e.g. empty or missing `text`. `provider`, `roomId`, `eventId` input data).

**Code** : `500 server error`

**Content** : `{ "error": "error message"}`

## Notes

This API call is not at present authenticated as it is assumed that it will be exposed only locally on the server infrastructure
