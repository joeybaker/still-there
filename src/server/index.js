// @flow

import dotenv from 'dotenv'
import { createServer } from 'http'
import Pushover from 'pushover-notifications'
import logger from '../lib/log.js'

type CacheItem = {|
  timeout: TimeoutID,
  timestamp: string,
  clientName: string,
  isDown: boolean,
|}
type Cache = {
  [clientName: string]: CacheItem,
}

const log = logger({ name: 'server' })
const configRes = dotenv.config()
if (configRes.error) {
  log.error(configRes.error)
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
const cache: Cache = {}
const pushover = new Pushover({
  user: PUSHOVER_USER,
  token: PUSHOVER_TOKEN,
})

const pingPushoverWithDown = ({
  clientName,
}: {
  clientName: $PropertyType<CacheItem, 'clientName'>,
}) => {
  const { timestamp } = cache[clientName]
  log.info('client is down', { clientName })
  pushover.send(
    {
      message: `Haven't heard from ${clientName ||
        'a client'} since ${timestamp}`,
      title: 'DOWN',
      priority: 1,
    },
    (err, res) => {
      if (err) log.error(err)
      else log.info(res)
    },
  )
}

const pingPushoverWithUp = ({
  clientName,
}: {
  clientName: $PropertyType<CacheItem, 'clientName'>,
}) => {
  log.info('client is back!', { clientName })
  pushover.send(
    {
      message: `${clientName || 'a client'} is back!`,
      title: 'Up!',
    },
    (err, res) => {
      if (err) log.error(err)
      else log.info(res)
    },
  )
}

const server = createServer((req, res) => {
  const { url } = req
  const timestamp = new Date().toISOString()
  const clientName = url.replace('/', '')
  if (!clientName) {
    log.info('Request recieved with no url so no client name found', req)
    res.end()
    return
  }

  const last = cache[clientName]
  log.info('recieved ping', { clientName })

  if (last && last.timeout != null) {
    log.info('resetting miss timeout', { clientName })
    clearTimeout(last.timeout)
  } else {
    log.info('tracking new client', { clientName })
  }

  if (last && last.isDown) {
    pingPushoverWithUp({ clientName })
  }

  cache[clientName] = {
    timeout: setTimeout(() => {
      cache[clientName].isDown = true
      pingPushoverWithDown({ clientName })
    }, alertDuration),
    timestamp,
    clientName,
    isDown: false,
  }
  res.end('pong')
})

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
})

server.listen(port)
log.info('running…')
if (!isDev) {
  pushover.send(
    { title: 'Listening', message: 'Server started' },
    (err, res) => {
      if (err) log.error(err)
      else log.info(res)
    },
  )
}
