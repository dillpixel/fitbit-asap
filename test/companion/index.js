import asap from "fitbit-asap/companion"

setTimeout(() => {
  console.log("Companion --> Device")
  asap.send("After a while, crocodile.")
}, 6000)

asap.onmessage = message => {
  console.log(message)
}
