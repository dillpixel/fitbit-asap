import asap from "../../companion"

console.log("Companion --> Device")
asap.send("After a while, crocodile.")

asap.onmessage = message => {
  console.log(message)
}
