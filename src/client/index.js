// @flow
import dotenv from 'dotenv'
import logger from '../lib/log.js'
import got from 'got'
import Pushover from 'pushover-notifications'

const log = logger({ name: 'client' })
const configRes = dotenv.config()
if (configRes.error) {
  log.error(configRes.error)
}
const {
  PING_INTERVAL,
  SERVER_URL,
  CLIENT_NAME,
  PUSHOVER_USER,
  PUSHOVER_TOKEN,
} = process.env
const pingInterval = parseInt(PING_INTERVAL, 10)

if (!CLIENT_NAME) throw new Error('Please set a CLIENT_NAME env var')
if (!SERVER_URL) throw new Error('Please set a SERVER_URL env var')

const pushover = new Pushover({
  user: PUSHOVER_USER,
  token: PUSHOVER_TOKEN,
})

let serverDownCount = 0

const ping = async () => {
  try {
    await got(`${SERVER_URL}/${CLIENT_NAME}`)
    serverDownCount = 0
    log.info('sent ping', { clientName: CLIENT_NAME })
  } catch (e) {
    log.error(e)
    ++serverDownCount

    if (serverDownCount > 2) {
      pushover.send(
        {
          message: `${CLIENT_NAME} can't find the server ${SERVER_URL}`,
          title: 'Server down',
          priority: 1,
        },
        (err, res) => {
          if (err) log.error(err)
          else log.info(res)
        },
      )
    }
  }
}

setInterval(ping, pingInterval)
ping()
log.info('running…')
