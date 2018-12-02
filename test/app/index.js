import asap from "../../app"

console.log("Device --> Companion")
asap.send("See you later, alligator.")

asap.onmessage = message => {
  console.log(message)
}
