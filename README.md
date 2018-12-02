# Fitbit ASAP
Fitbit ASAP allows you to send peer messages between a Fitbit OS device and companion without worrying about the connection state. When no connection is available, messages are cached and automatically sent once a connection is available (hence the name ASAP, an English acronym for "as soon as possible").
## Usage
This module assumes you're using the [Fitbit CLI](https://dev.fitbit.com/build/guides/command-line-interface/) in your workflow, which allows you to manage packages using [npm](https://docs.npmjs.com/about-npm/).
#### Installation
```
npm i fitbit-asap
```
Fitbit ASAP has a uniform API that works on both the app and the companion. The only difference is the module name in the import statement, which is `fitbit-asap/app` for the app and `fitbit-asap/companion` for the companion.

You'll also need to add permissions for `access_internet` and `run_background` in your `package.json` file.
```
"requestedPermissions": [
  "access_internet",
  "run_background"
]
```
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
### `asap.send(message, options)`
* Queues a message to be sent to the peer.
* `message` can be any data type.
* `options` are currently ignored, but a `timeout` option will be supported soon.

### `asap.onmessage = message => { ... }`
* Called when a message is received from the peer.
* `message` will be the same data type that was sent by the peer.
