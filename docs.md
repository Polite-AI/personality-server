## Classes

<dl>
<dt><a href="#Room">Room</a></dt>
<dd><p>Representation of a chat room which acts as a container
for messages. Each chat system room that we have ever seen
messages in has exactly one Room object
which is stored down to the database, and is uniquely
identified by its (provider, room_name) tuple.</p>
</dd>
<dt><a href="#Message">Message</a></dt>
<dd><p>Representation of a chat message in any system.
Messages are associated with Rooms and may have
Classifications and Appeals logged against them.</p>
</dd>
<dt><a href="#Database">Database</a></dt>
<dd><p>Implements a SQL based store for all Polite.ai applications
Stores rooms, messages with associated classifications and
appeals into a SQL database with a schema which is optimised
for bulk manipulation.</p>
<p>All interfaces apart from constructor are async returning a Promise which resolves or rejects
 when database operation completes.</p>
<p>Database methods are not normally called from application
code which should use the Room and Message class abstractions.
The interface classes automatically push their objects out to
the database using the methods provided by this class.</p>
</dd>
<dt><a href="#Language">Language</a></dt>
<dd><p>Generate responses in different languages, based on language packs in
languages/[language].json</p>
</dd>
<dt><a href="#Classify">Classify</a></dt>
<dd><p>Classification engine interface class, allows an engine to be
selected and handles the mechanics of calling that engine.</p>
</dd>
</dl>

<a name="Room"></a>

## Room
Representation of a chat room which acts as a container
for messages. Each chat system room that we have ever seen
messages in has exactly one Room object
which is stored down to the database, and is uniquely
identified by its (provider, room_name) tuple.

**Kind**: global class  

* [Room](#Room)
    * [new Room(room, provider)](#new_Room_new)
    * _instance_
        * [.id](#Room+id) : <code>String</code>
        * [.provider_id](#Room+provider_id) : <code>String</code>
        * [.provider](#Room+provider) : <code>String</code>
        * [.key](#Room+key) : <code>String</code>
        * [.time](#Room+time) : <code>Date</code>
        * [.exists](#Room+exists) : <code>Promise.&lt;bool&gt;</code>
        * [.getMessages([flags])](#Room+getMessages) ⇒ <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code>
    * _static_
        * [.getList(provider, [partial_id])](#Room.getList) ⇒ <code>Promise.&lt;Array.&lt;Room&gt;&gt;</code>

<a name="new_Room_new"></a>

### new Room(room, provider)
Create a Room.


| Param | Type | Description |
| --- | --- | --- |
| room | <code>\*</code> | If this is an Object then it's properties are copied to the new Room, otherwise it is regarded as a String and considered to be the unique room name |
| provider | <code>String</code> | Entity within who's namespace this room name is unique. If the logical room provider can have several rooms with the same name in different scopes or domains then provider will include the scope or domain to ensure uniqueness of room name. |

**Example**  
```js
development = new Room ('#developent:polite.ai', 'matrix');
development.exists.then(e => console.log('room',(e)?'exists':'notExist'));
var messages = development.getList({allData: true, limit:100});
```
<a name="Room+id"></a>

### room.id : <code>String</code>
Database assigned internal unique identifier

**Kind**: instance property of [<code>Room</code>](#Room)  
<a name="Room+provider_id"></a>

### room.provider_id : <code>String</code>
Room name

**Kind**: instance property of [<code>Room</code>](#Room)  
<a name="Room+provider"></a>

### room.provider : <code>String</code>
Provider namespace

**Kind**: instance property of [<code>Room</code>](#Room)  
<a name="Room+key"></a>

### room.key : <code>String</code>
Guaranteed unique key with at least 128 bits
of entropy, can be used for secure URLs

**Kind**: instance property of [<code>Room</code>](#Room)  
<a name="Room+time"></a>

### room.time : <code>Date</code>
Time/Date that this Room object was created

**Kind**: instance property of [<code>Room</code>](#Room)  
<a name="Room+exists"></a>

### room.exists : <code>Promise.&lt;bool&gt;</code>
Resolves to true if room exists in Database

**Kind**: instance property of [<code>Room</code>](#Room)  
<a name="Room+getMessages"></a>

### room.getMessages([flags]) ⇒ <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code>
Get a list of Message objects associated with a room

**Kind**: instance method of [<code>Room</code>](#Room)  
**Returns**: <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code> - Resolves to an array of matching message objects  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [flags] | <code>Object</code> |  | Search flags |
| flags.allData | <code>bool</code> | <code>false</code> | return deep data on Message objects - all classifications and appeals (may return lots of data) |
| flags.offset | <code>number</code> | <code>0</code> | start at this ones based offset in the list (skip offset-1 entries) |
| flags.limit | <code>number</code> | <code>50</code> | return limited number of records |
| flags.reverse | <code>bool</code> | <code>false</code> | list returned in most recent first date order |

<a name="Room.getList"></a>

### Room.getList(provider, [partial_id]) ⇒ <code>Promise.&lt;Array.&lt;Room&gt;&gt;</code>
returns a list of Rooms in the database

**Kind**: static method of [<code>Room</code>](#Room)  
**Returns**: <code>Promise.&lt;Array.&lt;Room&gt;&gt;</code> - Resolves to an Array of Room objects or rejects if no match spec  

| Param | Type | Description |
| --- | --- | --- |
| provider | <code>String</code> | Name of provider |
| [partial_id] | <code>String</code> | Restrict to rooms which have this string anywhere in their room name |

<a name="Message"></a>

## Message
Representation of a chat message in any system.
Messages are associated with Rooms and may have
Classifications and Appeals logged against them.

**Kind**: global class  

* [Message](#Message)
    * [new Message(message, provider, room_name, event_id, user, [time], [flags])](#new_Message_new)
    * [.id](#Message+id) : <code>String</code>
    * [.text](#Message+text) : <code>String</code>
    * [.provider](#Message+provider) : <code>String</code>
    * [.room](#Message+room) : [<code>Room</code>](#Room)
    * [.user](#Message+user) : <code>String</code>
    * [.event_id](#Message+event_id) : <code>String</code>
    * [.time](#Message+time) : <code>Date</code>
    * [.classification](#Message+classification) : <code>Array</code>
    * [.appeals](#Message+appeals) : <code>Array</code>
    * [.exists](#Message+exists) : <code>Promise.&lt;bool&gt;</code>
    * [.status](#Message+status) : <code>Promise.&lt;bool&gt;</code>
    * [.classify(classifier, classification)](#Message+classify) ⇒ <code>Promise.&lt;number&gt;</code>
    * [.appeal(type, text, user)](#Message+appeal) ⇒ <code>Promise.&lt;number&gt;</code>
    * [.destroy()](#Message+destroy) ⇒ <code>Promise</code>

<a name="new_Message_new"></a>

### new Message(message, provider, room_name, event_id, user, [time], [flags])
Create a Message.
When new, well formed Message objects are created,
they are asynchronously written down to a SQL
database. If an existing message with the same unique
(provider, event_id) exists in the database then these
are assumed to be the same message and the object is
populated from the database version.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| message | <code>\*</code> |  | If this is an Object then it's properties are copied to the new message object otherwise it is the UTF8 message body as a String |
| provider | <code>String</code> |  | Unique provider ID |
| room_name | <code>String</code> |  | Name of the room that this message was seen in |
| event_id | <code>String</code> |  | Unique ID for this message - usually generated by the provider and tuple (provider, event_id) should be globally unique. Multiple records with same vales for this tuple will be assumed to be same message even if other properties differ |
| user | <code>String</code> |  | User id associated with this message, usually the author, as identified by the provider |
| [time] | <code>Date</code> | <code>now</code> | creation time for this message |
| [flags] | <code>Object</code> |  | Search flags |
| flags.allData | <code>bool</code> | <code>false</code> | return deep data on Message objects - all classifications and appeals (may return lots of data) |

**Example**  
```js
var m = new Message("hello world", "myChat", "general", "12345", "john@example.com");
m.status.then(s => {
  if(s)
     console.log('message in database for id=', m.id);
  else
     console.log('message could not be created');
  m.exists.then(e => {
    console.log('message ', m.id, (e)?'already existed':'newly created');
  })
}).catch(err => console.log('create', err));
```
<a name="Message+id"></a>

### message.id : <code>String</code>
Database assigned internal unique identifier

**Kind**: instance property of [<code>Message</code>](#Message)  
<a name="Message+text"></a>

### message.text : <code>String</code>
Message text in UTF-8

**Kind**: instance property of [<code>Message</code>](#Message)  
<a name="Message+provider"></a>

### message.provider : <code>String</code>
Provider identifier

**Kind**: instance property of [<code>Message</code>](#Message)  
<a name="Message+room"></a>

### message.room : [<code>Room</code>](#Room)
Room object this message comes from

**Kind**: instance property of [<code>Message</code>](#Message)  
<a name="Message+user"></a>

### message.user : <code>String</code>
User identity associated with message

**Kind**: instance property of [<code>Message</code>](#Message)  
<a name="Message+event_id"></a>

### message.event_id : <code>String</code>
Unique message ID within this provider

**Kind**: instance property of [<code>Message</code>](#Message)  
<a name="Message+time"></a>

### message.time : <code>Date</code>
Time/Date that this Message object was created

**Kind**: instance property of [<code>Message</code>](#Message)  
<a name="Message+classification"></a>

### message.classification : <code>Array</code>
Array of classifications that have been applied
to this message.

**Kind**: instance property of [<code>Message</code>](#Message)  
<a name="Message+appeals"></a>

### message.appeals : <code>Array</code>
Array of appeals that have been lodged against
this message

**Kind**: instance property of [<code>Message</code>](#Message)  
<a name="Message+exists"></a>

### message.exists : <code>Promise.&lt;bool&gt;</code>
Resolves when the database status of this message
is known to true if the entry already existed or false
if it didn't exist in the database prior to this
instantiation.

**Kind**: instance property of [<code>Message</code>](#Message)  
<a name="Message+status"></a>

### message.status : <code>Promise.&lt;bool&gt;</code>
After a new Message is instantiated the database
is checked asynchronoulsy and the message is either
retrieved from the database or written to it.
When this completes, the exists Promise resolves
to true if the message was well formed and now in
the database. Resolves to false if there was a problem
with the message and it wasn't backed to the database.

**Kind**: instance property of [<code>Message</code>](#Message)  
<a name="Message+classify"></a>

### message.classify(classifier, classification) ⇒ <code>Promise.&lt;number&gt;</code>
Add a classification to a message

**Kind**: instance method of [<code>Message</code>](#Message)  
**Returns**: <code>Promise.&lt;number&gt;</code> - Resolves when saved to database to unique
  database ID  

| Param | Type | Description |
| --- | --- | --- |
| classifier | <code>String</code> | Which classifier generated this classification |
| classification | <code>String</code> | What was the classification |

<a name="Message+appeal"></a>

### message.appeal(type, text, user) ⇒ <code>Promise.&lt;number&gt;</code>
[appeal description]

**Kind**: instance method of [<code>Message</code>](#Message)  
**Returns**: <code>Promise.&lt;number&gt;</code> - Resolves when appeal is
  stored to unique database ID of appeal  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | 'report' unclassified message<br>'appeal' existing positive classification |
| text | <code>String</code> | free form text comment by reporter |
| user | <code>String</code> | identifier for user reporting issue |

<a name="Message+destroy"></a>

### message.destroy() ⇒ <code>Promise</code>
Removes all persitent database objects associated
with this Message. Doesn't affect the Room record
that contains it, but removes all associated
Classification and Appeal objects

**Kind**: instance method of [<code>Message</code>](#Message)  
**Returns**: <code>Promise</code> - Resolves or rejects depending on
  whether the destroy succeeds.  
<a name="Database"></a>

## Database
Implements a SQL based store for all Polite.ai applications
Stores rooms, messages with associated classifications and
appeals into a SQL database with a schema which is optimised
for bulk manipulation.

All interfaces apart from constructor are async returning a Promise which resolves or rejects
 when database operation completes.

Database methods are not normally called from application
code which should use the Room and Message class abstractions.
The interface classes automatically push their objects out to
the database using the methods provided by this class.

**Kind**: global class  
<a name="new_Database_new"></a>

### new Database(credentials, MessageClass, RoomClass)
Create a new database worker


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| credentials | <code>Object</code> | <code>from_config</code> | Postgres database credentials |
| MessageClass | [<code>Message</code>](#Message) |  | Class definition to be used when creating messages |
| RoomClass | [<code>Room</code>](#Room) |  | Class definition to be used when creating rooms |

<a name="Language"></a>

## Language
Generate responses in different languages, based on language packs in
languages/[language].json

**Kind**: global class  

* [Language](#Language)
    * [new Language(language, personality)](#new_Language_new)
    * [.response(classification)](#Language+response) ⇒ <code>String</code>

<a name="new_Language_new"></a>

### new Language(language, personality)
Initialises a language outputter based on language and personality required


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| language | <code>String</code> | <code>english</code> | Name of a valid language pack |
| personality | <code>String</code> | <code>first</code> | Name of a valid personality, defaults to first |

<a name="Language+response"></a>

### language.response(classification) ⇒ <code>String</code>
Generates a language response for a classification

**Kind**: instance method of [<code>Language</code>](#Language)  
**Returns**: <code>String</code> - Human output string in this language and personality  

| Param | Type | Description |
| --- | --- | --- |
| classification | <code>String</code> | The classification results (currently ignored) |

<a name="Classify"></a>

## Classify
Classification engine interface class, allows an engine to be
selected and handles the mechanics of calling that engine.

**Kind**: global class  

* [Classify](#Classify)
    * [new module.exports.Classify(classifier)](#new_Classify_new)
    * [.classify(text, lang)](#Classify+classify) ⇒ <code>Promise.&lt;Object&gt;</code>

<a name="new_Classify_new"></a>

### new module.exports.Classify(classifier)
Create an classifier


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| classifier | <code>String</code> | <code>default</code> | Name of classification engine to use, if not   set then defaults arbitrarily to first available |

<a name="Classify+classify"></a>

### classify.classify(text, lang) ⇒ <code>Promise.&lt;Object&gt;</code>
Send a text string to the classification server and await results

**Kind**: instance method of [<code>Classify</code>](#Classify)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Resolves to the result object or rejects if there
  are communication problems with the classification server  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| text | <code>String</code> |  | Text to be classified |
| lang | <code>String</code> | <code>english</code> | The language that the text can be expected to be in |
