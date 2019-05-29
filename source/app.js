import { readFileSync, unlinkSync, writeFileSync } from "fs"
import { peerSocket } from "messaging"

const debug = false

//====================================================================================================
// Initialize Queue
//====================================================================================================

let queue = []

// Attempt to load a saved queue on startup
try {
  queue = readFileSync("_asap_queue", "json")
  // Ensure that the queue is an array
  if (!Array.isArray(queue)) {
    queue = []
  }
}
// If a saved queue could not be loaded
catch (error) {
  // Continue with an empty queue
  queue = []
}

//====================================================================================================
// Enqueue
//====================================================================================================

function enqueue(message, options) {
  // Set the default options
  options = options || {}
  options.timeout = options.timeout || 86400000 // 24 hours
  // Store metadata with the message
  const data = {
    _asap_id: queue.length > 0 ? Math.max(...queue) + 1 : 1,
    _asap_created: Date.now(),
    _asap_timeout: options.timeout,
    _asap_message: message,
    _asap_receipt: false
  }
  // Save the message to disk
  writeFileSync("_asap_" + data._asap_id, data, "json")
  // Add the message ID to the queue
  queue.push(data._asap_id)
  // Persist the queue to disk
  writeFileSync("_asap_queue", queue, "json")
  // If the queue was previously empty
  if (queue.length === 1) {
    // Begin processing the queue
    process()
  }
  debug && console.log("Enqueued message #" + data._asap_id)
}

//====================================================================================================
// Dequeue
//====================================================================================================

function dequeue(id) {
  // If an ID is provided
  if (id) {
    // Iterate over the queue
    for (let i in queue) {
      // If a match is found
      if (queue[i] === id) {
        // Delete the message from disk
        try {
          unlinkSync("_asap_" + id)
        } catch (error) {
          debug && console.log(error)
        }
        // Remove the message ID from the queue
        queue.splice(i, 1)
        break
      }
    }
    debug && console.log("Dequeued message #" + id)
  }
  // If an ID is not provided
  else {
    // Delete all messages from disk
    for (let i in queue) {
      unlinkSync("_asap_" + queue[i])
    }
    // Reset the queue
    queue = []
    debug && console.log("Dequeued all messages")
  }
  // Persist the queue to disk
  writeFileSync("_asap_queue", queue, "json")
  // Continue processing the queue
  process()
}

//====================================================================================================
// Process Queue
//====================================================================================================

function process() {
  // If the queue is not empty
  if (queue.length > 0) {
    // Get the next message ID
    const id = queue[0]
    // Attempt to read the message from disk
    try {
      const message = readFileSync("_asap_" + id, "json")
      // If the message has expired
      if (message._asap_created + message._asap_timeout < Date.now()) {
        // Dequeue the message
        dequeue(id)
      }
      // If the message has not expired
      else {
        // Attempt to send the message
        try {
          peerSocket.send(message)
        } catch (error) {
          debug && console.log(JSON.stringify(error))
        }
      }
    }
    // If the message could not be read from disk
    catch {
      // Dequeue the message
      dequeue(id)
    }
  }
}

// Begin processing the queue when a connection opens
peerSocket.addEventListener("open", () => {
  debug && console.log("Peer socket opened")
  process()
})

//====================================================================================================
// Incoming Messages
//====================================================================================================

// When a message is recieved from the peer
peerSocket.addEventListener("message", event => {
  const data = event.data
  // If the message is being managed by ASAP
  if (data._asap_id > -1) {
    // If the message is a receipt
    if (data._asap_receipt) {
      // Dequeue the message
      dequeue(data._asap_id)
    }
    // If the message originated from the peer
    else {
      asap.onmessage(data._asap_message)
      // Send a receipt
      try {
        peerSocket.send({_asap_id: data._asap_id, _asap_receipt: true})
      } catch (error) {
        debug && console.log(error)
      }
    }
  }
})

//====================================================================================================
// Exports
//====================================================================================================

const asap = {
  send: enqueue,
  cancel: dequeue,
  onmessage: () => {}
}

export default asap
