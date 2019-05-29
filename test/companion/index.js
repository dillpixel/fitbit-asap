import asap from "../../source/companion"
import { settingsStorage } from "settings"

for (let i = 0; i < 10; i++) {
  asap.send(`Message #${i + 1}`)
}

asap.onmessage = message => {
  console.log(message)
}
