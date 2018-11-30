# Fitbit ASAP
Fitbit ASAP allows you to send peer messages between a Fitbit OS device and companion without worrying about the connection state. When no connection is available, messages are cached and automatically sent once a connection is available (hence the name ASAP, an English acronym for "as soon as possible").
#### Installation
```
npm i fitbit-asap
```
#### Device
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
