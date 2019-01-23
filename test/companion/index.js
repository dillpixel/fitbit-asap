import asap from "../../companion"

asap.onmessage = message => {
  console.log(message)
  console.log("Companion --> Device")
  asap.send("After a while, crocodile.")
}
