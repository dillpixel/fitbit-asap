import { readFileSync, writeFileSync } from "fs"
import { peerSocket } from "messaging"

const debug = false

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
  // Attempt to send all data
  send_all()
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
    _asap_id: Math.floor(Math.random() * 10000000000), // Random 10-digit number
    _asap_created: now,
    _asap_timeout: options.timeout,
    _asap_status: "sending",
    _asap_message: message
  }
  // Add the data to the queue
  enqueue(data)
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

// Remove all messages with "session" timeout from the queue
persist_queue(
  get_queue().filter(msg => {
    return msg._asap_timeout !== "session"
  })
)

// Attempt to send enqueued data after startup (the open event is unreliable during startup)
setTimeout(() => {
  send_all()
}, 1000)

// Attempt to send enqueued data when a connection opens after startup
peerSocket.addEventListener("open", () => {
  send_all()
})

// Receive messages from the companion
peerSocket.addEventListener("message", event => {
  const data = event.data
  if (data._asap_id) {
    switch (data._asap_status) {
      case "sending":
        if (data._asap_id) {
          try {
            peerSocket.send({_asap_status: "received", _asap_id: data._asap_id})
            asap.onmessage(data._asap_message)
          } catch (error) {
            debug && console.log(error)
          }
        }
        break
      case "received":
        dequeue(data._asap_id)
        break
    }
  }
})

const asap = {
  send: send,
  onmessage: () => {}
}

export default asap
