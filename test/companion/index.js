import asap from "../../companion"
import { settingsStorage } from "settings"

asap.onmessage = message => {
  console.log(message)
  console.log("Companion --> Device")
  asap.send("After a while, crocodile.")
}

settingsStorage.onchange = function(event) {
  if (event.key == "text_input") {
    asap.send(`Text input changed: ${JSON.parse(event.newValue).name}`)
  }
}
