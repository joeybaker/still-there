// @flow
import bunyan from 'bunyan'

const NAME = 'still-there'

export default ({ name = NAME }: { name?: string } = {}) =>
  bunyan.createLogger({ name: name === NAME ? name : `NAME ${name}` })
