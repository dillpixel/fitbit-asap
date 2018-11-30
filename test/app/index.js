import asap from "fitbit-asap/app"

setTimeout(() => {
  console.log("Device --> Companion")
  asap.send("See you later, alligator.")
}, 3000)

asap.onmessage = message => {
  console.log(message)
}
