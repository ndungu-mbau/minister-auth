import 'babel-polyfill'
import natsServer from 'nats'
import Hemera from 'nats-hemera'

import resolvers from './resolvers'

const {
  NODE_ENV = 'development',
  NATS_URL } = process.env

const nats = natsServer.connect({
  url: NATS_URL,
});

const hemera = new Hemera(nats, {
  logLevel: 'silent',
});

hemera.ready(async () => {
  await resolvers({ hemera })
  console.log("Auth Service running successfully")
})
