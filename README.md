# Fitbit ASAP
Fitbit ASAP allows you to send peer messages reliably between a Fitbit OS device and companion. If a peer is not connected at the time of sending, messages are cached and automatically sent as soon as a connection becomes available (hence the name ASAP, an English acronym for "as soon as possible"). Fitbit ASAP also handles the re-sending of dropped messages (e.g. when the peer connection is lost before a message has finished sending).
## Usage
This module assumes you're using the [Fitbit CLI](https://dev.fitbit.com/build/guides/command-line-interface/) in your workflow, which allows you to manage packages using [npm](https://docs.npmjs.com/about-npm/).
#### Installation
```
npm i fitbit-asap
```
Fitbit ASAP has a uniform API that works on both the app and the companion. The only difference is the module name in the import statement, which is `fitbit-asap/app` for the app and `fitbit-asap/companion` for the companion.
#### App
```javascript
import asap from "fitbit-asap/app"

asap.send("See you later, alligator.")

asap.onmessage = message => {
  console.log(message) // After a while, crocodile.
}
```
#### Companion
```javascript
import asap from "fitbit-asap/companion"

asap.send("After a while, crocodile.")

asap.onmessage = message => {
  console.log(message) // See you later, alligator.
}
```
## API
#### `asap.send(message, options)`
Queues a message to be sent to the peer.
##### `message` **any**
The message to be sent to the peer. This can be any data type.
##### `options` **object**
Options for how this message should be handled. Currently, `timeout` is the only option.
##### `options.timeout` **integer**
The maximum number of milliseconds a message can remain in the queue.
#### `asap.onmessage = message => { ... }`
Called when a message is received from the peer. The function assigned to `asap.onmessage` accepts a single parameter containing the message, which will have the same data type it had when it was passed into the `send` function.
#### `asap.cancel()`
Cancels all queued messages.
