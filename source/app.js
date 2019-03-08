import { readFileSync, writeFileSync } from "fs"
import { peerSocket } from "messaging"

const debug = false
var last_generated_message_id = -1
var last_received_message_id = -1
var resend_timer = null

const get_queue = () => {
  try {
    const queue = readFileSync("_asap_queue", "cbor")
    if (Array.isArray(queue)) {
      return queue
    } else {
      return []
    }
  } catch (error) {
    return []
  }
}

const enqueue = (data) => {
  debug && console.log("Enqueue Message ID #" + data._asap_id)
  // Add the message to the queue
  const queue = get_queue()
  queue.push(data)
  // Write the queue to disk
  persist_queue(queue)
}

const dequeue = (id) => {
  debug && console.log("Dequeue Message ID #" + id)
  // Remove the message from the queue
  const queue = get_queue()
  for (let i in queue) {
    if (queue[i]._asap_id === id) {
      queue.splice(i)
      break
    }
  }
  // Write the queue to disk
  persist_queue(queue)
}

const send = (message, options) => {
  const now = Date.now()
  // Set default options
  options = options || {}
  options.timeout = options.timeout || 2592000000 // 30 days
  // Create the data object
  const data = {
    _asap_id: get_next_id(),
    _asap_created: now,
    _asap_timeout: options.timeout,
    _asap_message: message,
    _asap_ack: false
  }
  // Add the data to the queue
  enqueue(data)

  if (get_queue().length == 1) {
    send_next()
  }
}

const get_next_id = () => {
  if (last_generated_message_id < 0) {
    last_generated_message_id = Math.floor(Math.random() * 10000000000)
  }
  return ++last_generated_message_id
}

const send_next = () => {
  if (resend_timer == null) {
    const queue = get_queue()
    if (queue.length > 0) {
      try {
        if (is_message_expired(queue[0])) {
          return
        }
        peerSocket.send(queue[0])
        set_resend_timer()
      } catch (error) {
        debug && console.log(error)
      }
    }
  }
}

const send_all = () => {
  const queue = get_queue()
  for (let data of queue) {
    try {
      peerSocket.send(data)
    } catch (error) {
      debug && console.log(error)
    }
  }
}

const persist_queue = (queue) => {
  try {
    writeFileSync("_asap_queue", queue, "cbor")
  } catch (error) {
    debug && console.log(error)
  }
}

const is_message_expired = (message) => {
  if (!isNaN(message._asap_timeout)) {
    return (Date.now() >= message._asap_created + message._asap_timeout)
  }
  return false
}

// Sets a timer to resend the latest message after X seconds
// There is always just one timer
const set_resend_timer = () => {
  resend_timer = setTimeout(() => {
    clear_resend_timer()
    send_next()
  }, 5000);
}

// Clears the resend timer - for the case we get an ACK
const clear_resend_timer = () => {
  if (resend_timer) {
    clearTimeout(resend_timer)
    resend_timer = null
  }
}

// Set the last generated ID in case we load a persisted queue on startup
const set_last_generated_id_according_to_queue = () => {
  const last_message = get_queue().slice(-1)[0]
  if (last_message && last_message._asap_id) {
    last_generated_message_id = last_message._asap_id + 1
  }
}
set_last_generated_id_according_to_queue()

// Remove all messages with "session" timeout from the queue
persist_queue(
  get_queue().filter(msg => {
    return msg._asap_timeout !== "session"
  })
)

// Attempt to send enqueued data after startup (the open event is unreliable during startup)
setTimeout(() => {
  send_next()
}, 1000)

// Attempt to send enqueued data when a connection opens after startup
peerSocket.addEventListener("open", () => {
  send_next()
})

// Receive messages from the companion
peerSocket.addEventListener("message", event => {
  const data = event.data
  if (data._asap_id) {
    if (!data._asap_ack) {
      // Received a real message
      if (data._asap_id > last_received_message_id) {
        asap.onmessage(data._asap_message)
        last_received_message_id = data._asap_id
      }
      try {
        peerSocket.send({_asap_ack: true, _asap_id: data._asap_id})
      } catch (error) {
        debug && console.log(error)
      }
    } else {
      // Received an ACK
      dequeue(data._asap_id)
      clear_resend_timer()
      send_next()
    }
  }
})

const asap = {
  send: send,
  onmessage: () => {}
}

export default asap
