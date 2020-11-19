const request = require('request')

function templateSend (token, body) {
  return new Promise((resolve, reject) => {
    request({
      url: `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`,
      method: 'POST',
      json: true,
      headers: {
        'content-type': 'application/json'
      },
      body: body
    }, (error, response, body) => {
      if (error) {
        reject(error)
      }
      resolve((typeof response.body === 'object') ? response.body : JSON.parse(response.body))
    })
  })
}

module.exports = {
  templateSend
}
