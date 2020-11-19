const tcb = require('@cloudbase/node-sdk')
const http = require('http.js')
const cloud = tcb.init({
  env: tcb.SYMBOL_CURRENT_ENV
})
const db = cloud.database()

exports.main = async event => {
  let accessToken = {}
  try {
    accessToken = (await db.collection('wxid').doc('access_token').get()).data[0]
    const overtime = new Date((new Date()).valueOf() + 60 * 1000)
    if (accessToken.time > overtime) {
      return accessToken.value
    } else {
      const result = await http.getToken()
      if (result.access_token != null) {
        const { access_token, expires_in } = result
        await db.collection('wxid').doc('access_token').update({
          time: db.serverDate({
            offset: expires_in * 1000
          }),
          value: access_token
        })
        return access_token
      } else {
        return {
          code: result.errmsg
        }
      }
    }
  } catch (e) {
    const result = await http.getToken()
    if (result.access_token != null) {
      const { access_token, expires_in } = result
      try {
        await db.collection('wxid').add({
          _id: 'access_token',
          time: db.serverDate({
            offset: expires_in * 1000
          }),
          value: access_token
        })
        return access_token
      } catch (e) {
        return {
          code: 'db is no found!'
        }
      }
    } else {
      return {
        code: result.errmsg
      }
    }
  }
}
