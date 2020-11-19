const tcb = require('@cloudbase/node-sdk')
const http = require('http.js')
const { templateId } = require('key.json')

const cloud = tcb.init({
  env: tcb.SYMBOL_CURRENT_ENV
})

exports.main = async (event) => {
  const { openid, value } = event
  if (openid == null || value == null) return 404
  const token = (await cloud.callFunction({
    name: 'getToken'
  })).result
  if (token.code == null) {
    const obj = {
      touser: openid,
      template_id: templateId,
      url: 'https://acc.cloudbase.vip/scan/eks/', // 此为示例，可自行更改，以文档为准
      data: {
        first: {
          value: '消息确认通知',
          color: '#173177'
        },
        keyword1: {
          value: '云开发公众号示例模块',
          color: '#173177'
        },
        keyword2: {
          value: new Date(new Date().getTime() + 28800000).toLocaleString(),
          color: '#173177'
        },
        keyword3: {
          value: `正常收到消息【${value}】`,
          color: '#173177'
        },
        remark: {
          value: '本示例只供参考，请根据自身情况变更',
          color: '#07C160'
        }
      }
    }
    const result = await http.templateSend(token, obj)
    console.log(result)
    return null
  } else {
    return {
      code: -1,
      msg: token.code
    }
  }
}
