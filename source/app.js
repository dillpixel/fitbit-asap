import { readFileSync, writeFileSync } from "fs"
import { peerSocket } from "messaging"

const debug = false

const get_queue = () => {
  try {
    return readFileSync("_asap_queue", "cbor")
  } catch (error) {
    return []
  }
}

const enqueue = (data) => {
  debug && console.log("Enqueue Message ID #" + data._asap_id)
  const queue = get_queue()
  queue.push(data)
  writeFileSync("_asap_queue", queue, "cbor")
  // Attempt to send the data immediately
  if (peerSocket.readyState === peerSocket.OPEN) {
    peerSocket.send(data)
  }
}

const dequeue = (id) => {
  debug && console.log("Dequeue Message ID #" + id)
  const queue = get_queue()
  for (let i in queue) {
    if (queue[i]._asap_id === id) {
      queue.splice(i)
      break
    }
  }
  writeFileSync("_asap_queue", queue, "cbor")
}

peerSocket.onopen = () => {
  const queue = get_queue()
  // Attempt to send all enqueued data
  for (let data of queue) {
    peerSocket.send(data)
  }
}

peerSocket.onmessage = event => {
  const data = event.data
  if (data._asap_id) {
    switch (data._asap_status) {
      case "sending":
        if (data._asap_id && peerSocket.readyState === peerSocket.OPEN) {
          asap.onmessage(data._asap_message)
          peerSocket.send({_asap_status: "received", _asap_id: data._asap_id})
        }
        break
      case "received":
        dequeue(data._asap_id)
        break
    }
  }
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
    _asap_expires: now + options.timeout,
    _asap_status: "sending",
    _asap_message: message
  }
  // Add the data to the queue
  enqueue(data)
}

const asap = {
  send: send,
  onmessage: () => {}
}

export default asap
