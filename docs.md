## Members

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
</dl>

## Functions

<dl>
<dt><a href="#value">value([flags])</a> ⇒ <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code></dt>
<dd><p>Get a list of Message objects associated with a room</p>
</dd>
<dt><a href="#value">value()</a> ⇒ <code>Promise</code></dt>
<dd><p>Removes persitent database object associated
with this Room.</p>
</dd>
</dl>

<a name="Room"></a>

## Room
Representation of a chat room which acts as a container
for messages. Each chat system room that we have ever seen
messages in has exactly one Room object
which is stored down to the database, and is uniquely
identified by its (provider, room_name) tuple.

**Kind**: global variable  
<a name="Message"></a>

## Message
Representation of a chat message in any system.
Messages are associated with Rooms and may have
Classifications and Appeals logged against them.

**Kind**: global variable  
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

**Kind**: global variable  
<a name="Language"></a>

## Language
Generate responses in different languages, based on language packs in
languages/[language].json

**Kind**: global variable  
<a name="value"></a>

## value([flags]) ⇒ <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code>
Get a list of Message objects associated with a room

**Kind**: global function  
**Returns**: <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code> - Resolves to an array of matching message objects  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [flags] | <code>Object</code> |  | Search flags |
| flags.allData | <code>bool</code> | <code>false</code> | return deep data on Message objects - all classifications and appeals (may return lots of data) |
| flags.offset | <code>number</code> | <code>0</code> | start at this ones based offset in the list (skip offset-1 entries) |
| flags.limit | <code>number</code> | <code>50</code> | return limited number of records |
| flags.reverse | <code>bool</code> | <code>false</code> | list returned in most recent first date order |

<a name="value"></a>

## value() ⇒ <code>Promise</code>
Removes persitent database object associated
with this Room.

**Kind**: global function  
**Returns**: <code>Promise</code> - Resolves or rejects depending on
  whether the destroy succeeds.  
