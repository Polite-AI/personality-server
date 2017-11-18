## REST API version 1.0 documentation
# Calls

[join](#join-a-new-room) Join a new Room and start a meta-data dialogue

[message](#process-an-inbound-message) Process an inbound message and possibly send a response for the Room

[delete](#delete-a-message-or-room) Delete a Message or Room

# Join a new room
Create a new room in the databse if we haven't been here before and start the dialog to capture meta-data.

**URL** : `/${apiVersion}/join/:classifier/:language/:personality`

**URL Parameters** : `classifier=[string]`, `:language=[string]`, `:personality=[string]`. Where `classifier` is the name of the classifier (defaults to 'wiki-detox'), `language` is the natural language (defaults to 'english'), and `personality` is the bot personality (defaults to 'standard' a neutral, factual expression).

**Method** : `POST`

**Auth required** : NO

**Data**: `{
  provider,
  roomId,
  userId,
}`

## Success Response

**Condition** : If room data is sufficient and the room either exists, or can be found in the database.

**Code** : `200 OK`

**Content example**

```json
{
    "status": "OK",
    "response": "Polite.ai bot here, thanks for inviting me @rob:polite.ai Please can you tell me a bit more about this room, for example is it technical, social, work related etc? So that I know you are talking to me,please could you preface your reply with polite : or tag me in the response e.g.\"polite: it is a technical group\""
}
```

```json
{
    "status": "seenBefore"
}
```

## Error Responses

**Condition** : If the room identifucation data is malformed such that the room can neither be identified in the database nor injected as a new one (e.g. empty or missing `provider` or `roomId` input data).

**Code** : `500 server error`

**Content** : `{ "error": "error message"}`

## Notes

Metadata about the room is gathered by dialogue with room users, the returned response text should therefore be injected into the room or sent as a direct message to the user who invited the bot depending on its capabilites and configuration. Because we will receive all future messages through the message call, this is sufficient to start a dialogue in the room. It is currently a "feature" of the implementation that if the room goes quiescent and nobody is sending messages then there is no way for the personality server to asynchronously inject new messages to progress an active dialogue (i.e. it can only ever send replies in response to messages it receives). This doesn't seem to be a problem at present, but at some stage we will almost certainly need to invent a personality-server -> bot callback mech so that we can initiate and maintain dialogues in the absence of inbound messages and responses.

This API call is not at present authenticated as it is assumed that it will be exposed only locally on the server infrastructure


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
}
```

```json
{
    "status": "seenBefore",
    "triggered": false,
}
```

```json
{
    "status": "OK",
    "triggered": true,
    "response": "hey @user that comment was a little aggressive"
}
```

## Error Responses

**Condition** : If the message data is malformed such that the message can neither be identified in the database as a seen message, nor injected as a new one (e.g. empty or missing `text`. `provider`, `roomId`, `eventId` input data).

**Code** : `500 server error`

**Content** : `{ "error": "error message"}`

## Notes

This API call is not at present authenticated as it is assumed that it will be exposed only locally on the server infrastructure

# Delete a Message or Room

**URL** : `/${apiVersion}/delete`

**Method** : `POST`

**Auth required** : NO

**Data**: `{
  provider,
  roomId,
  eventId
}` `provider` plus one of [ `roomId` | `eventId` ] is required

## Success Response

**Condition** : If a `provider` and `eventId` are passed then the single message specified is deleted. If a `provider` and `roomId` are specified then the Room and all it's messages are deleted.

**Code** : `200 OK`


## Error Responses

**Condition** : If `provider` is not specified, or at least one of `eventId` or `roomId` is not specified, or they don't refer to a valid entity.

**Code** : `500 server error`

**Content** : `{ "error": "error message"}`

## Notes

This call is super dangerous and provided mostly for use by the testing infrastructure. It may well be deprecated at or before the point where someone works out how to abuse it.
