const tcb = require('@cloudbase/node-sdk')
const xml2js = require('xml2js')
const xmlParser = new xml2js.Parser()
const cloud = tcb.init({
  env: tcb.SYMBOL_CURRENT_ENV
})

exports.main = async (event) => {
  // 获取请求的body信息以及get参数
  const msgBody = event.body
  const {
    msg_signature,
    nonce,
    timestamp,
    echostr
  } = event.queryStringParameters

  // 判断get参数是否存在消息签名，如果存在将作为微信服务器消息推送处理
  if (msg_signature != null) {
    // 判断body请求体是否存在，如果不存在可能是微信服务接入echo
    if (msgBody != null) {
      // 解析body的信息，拿出encrypt加密的信息（安全模式下）
      const encryptedMsg = Buffer.from(msgBody, 'base64').toString()
      const encrypt = (await xmlParser.parseStringPromise(encryptedMsg)).xml.Encrypt[0]

      // 引入微信加解密处理模块，传入相关必要信息
      const WechatEncrypt = require('./util')
      const WXKEY = require('./key.json')
      const wechatEncrypt = new WechatEncrypt(WXKEY)

      // 使用微信加解密处理模块对请求的加密进行签名运算
      const signature = wechatEncrypt.genSign({
        timestamp,
        nonce,
        encrypt
      })

      // 判断请求签名是否和运算签名一致
      if (signature === msg_signature) {
        // 使用加解密处理模块对加密体解密
        const xmlMsg = wechatEncrypt.decode(encrypt)
        const xml = (await xmlParser.parseStringPromise(xmlMsg)).xml

        // 判断解密后的明文信息是否为文字消息类型
        if (xml.MsgType[0] === 'text') {
          try {
            await cloud.callFunction({
              name: 'send',
              data: {
                openid: xml.FromUserName[0],
                value: xml.Content[0]
              }
            })
          } catch (e) {}
          // 构建消息发送的时间戳
          const resTime = Date.parse(new Date()) / 1000
          // 构建明文信息返回即可（无需加密），返回：收到【信息】
          const res = `<xml>
                        <ToUserName><![CDATA[${xml.FromUserName[0]}]]></ToUserName>
                        <FromUserName><![CDATA[${xml.ToUserName[0]}]]></FromUserName>
                        <CreateTime>${resTime}</CreateTime>
                        <MsgType><![CDATA[text]]></MsgType>
                        <Content><![CDATA[收到【${xml.Content[0]}】]]></Content>
                      </xml>`
          return res
        } else {
          // 如果是其他类型则返回success，告诉微信服务器正常接收
          return 'success'
        }
      } else {
        // 虚假签名，返回error
        return 'error'
      }
    } else {
      // 发送接收的echostr,告知微信服务器接收正常
      return echostr
    }
  } else {
    // 无签名信息，非法请求，阻断404返回
    return 404
  }
}
