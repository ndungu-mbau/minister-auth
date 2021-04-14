import sha1 from 'sha1'
import jwt from 'jsonwebtoken'
import random from 'randomatic'
import axios from 'axios'

const {
  SECRET,
  LIVEGO_URL,
} = process.env

const topic = 'auth-service'

export default async ({ hemera, db }) => {
  hemera.add({
    topic,
    cmd: 'create-admin'
  }, async ({ name, contact, password, churchName }) => {
    const id = random('0', 6).split('').reduce((acc, value, idx) => idx === 3? `${acc}-${value}`: `${acc}${value}`)

    const { data: { data: streamingKey }} = await axios(`${LIVEGO_URL}/control/get?room=${id}`)

    await hemera.act({
      topic:'db-service',
      cmd:'insert-one',
      collection: 'church',
      obj: { id, name: churchName, streamingKey }
    })

    const hashedPassword = sha1(password)

    const { data: { _id }} = await hemera.act({
      topic:'db-service',
      cmd:'insert-one',
      collection:'admins',
      obj: { name, contact, hashedPassword, church: id }
    })

    console.log(_id)

    const token = jwt.sign({ contact, _id, church: id, admin: true }, SECRET)

    return { token }
  })

  hemera.add({
    topic,
    cmd: 'create-user'
  }, async ({ name, contact, password, church } ) => {
    const hashedPassword = sha1(password)

    const { _id } = hemera.act({
      topic:'db-service',
      cmd:'insert-one',
      collection:'users',
      obj: { name, contact, hashedPassword, church, archived: false }
    })

    const token = jwt.sign({ contact, _id, church, admin: false }, SECRET)

    return { token }
  })

  hemera.add({
    topic,
    cmd: 'login-admin'
  }, async ({ contact, password }) => {
    const { data: user } = await hemera.act({
      topic: 'db-service',
      cmd:'find-one',
      collection:'admins',
      params: { contact }
    })

    if(user && user.contact === contact){
      if(user.hashedPassword === sha1(password)){
        const token = jwt.sign({ contact, _id: user._id, church: user.church, admin: true }, SECRET)

        return { token, ok: true }
      } else {
        return { ok: false, message:"password was incorrect"}
      }
    } else {
      return { ok: false, message:"user not found"}
    }
  })

  hemera.add({
    topic,
    cmd: 'login-user'
  }, async ({ contact, password }) => {
    const { data: user } = await hemera.act({
      topic: 'db-service',
      cmd:'find-one',
      collection:'users',
      params: { contact, archived: false }
    })

    if(user && user.contact === contact){
      if(user.hashedPassword === sha1(password)){
        const token = jwt.sign({ contact, _id: user._id, church: user.church, admin: false }, SECRET)

        return { token, ok: true }
      } else {
        return { ok: false, message:"password was incorrect"}
      }
    } else {
      return { ok: false, message:"user not found"}
    }
  })

  hemera.add({
    topic,
    cmd: 'verify-jwt'
  }, async ({ token }) => {
    if(!token){
      return { message: "not authenticated", ok: false }
    } else {
      const user = jwt.decode(token)
      return user
    }
  })
}
