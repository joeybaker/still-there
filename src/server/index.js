// @flow

import dotenv from 'dotenv'
import { createServer } from 'http'
import Pushover from 'pushover-notifications'
import logger from '../lib/log.js'

type Cache = {|
  last: {
    timeout: ?TimeoutID,
    timestamp: string,
    clientName: string,
  },
|}

const configRes = dotenv.config()
if (configRes.error) {
  console.error(configRes.error)
}
const {
  PORT,
  ALERT_DURATION,
  PUSHOVER_USER,
  PUSHOVER_TOKEN,
  NODE_ENV,
} = process.env
const isDev = NODE_ENV === 'development'
const port = parseInt(PORT, 10)
const alertDuration = parseInt(ALERT_DURATION, 10)
const cache: Cache = {
  last: {
    timeout: null,
    timestamp: '',
    clientName: '',
  },
}
const pushover = new Pushover({
  user: PUSHOVER_USER,
  token: PUSHOVER_TOKEN,
})

const pingPushover = () => {
  const {
    last: { timestamp, clientName },
  } = cache
  pushover.send(
    {
      message: `Haven't heard from ${clientName ||
        'a client'} since ${timestamp}`,
      title: 'DOWN',
      priority: 1,
    },
    (err, res) => {
      if (err) console.error(err)
      else console.info(res)
    },
  )
}

const server = createServer((req, res) => {
  const { last } = cache
  const { url } = req
  if (last.timeout != null) {
    clearTimeout(last.timeout)
  }

  cache.last = {
    timeout: setTimeout(pingPushover, alertDuration),
    timestamp: new Date().toISOString(),
    clientName: url.replace('/', ''),
  }
  console.info(`recieved ping from ${cache.last.clientName}`)
  res.end('pong')
})

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
})

server.listen(port)
console.info('running…')
if (!isDev) {
  pushover.send(
    { title: 'Listening', message: 'Server started' },
    (err, res) => {
      if (err) console.error(err)
      else console.info(res)
    },
  )
}
