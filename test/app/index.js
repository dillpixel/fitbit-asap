import asap from "../../source/app"
import { HeartRateSensor } from "heart-rate"

for (let i = 0; i < 10; i++) {
  asap.send(`Message #${i + 1}`)
}

asap.onmessage = message => {
  console.log(message)
}
