const request = require('request')
const { APPID, APPSECRET } = require('key.json')

function getToken () {
  return new Promise((resolve, reject) => {
    request({
      url: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`,
      method: 'GET'
    }, (error, response, body) => {
      if (error) {
        reject(error)
      }
      resolve((typeof response.body === 'object') ? response.body : JSON.parse(response.body))
    })
  })
}

module.exports = {
  getToken
}
