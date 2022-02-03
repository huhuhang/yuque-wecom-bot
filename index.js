/**
 * 
 * @param {JSON} response 处理JSON格式的响应
 * @returns 
 */
async function gatherResponse(response) {
  const { headers } = response
  const contentType = headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return JSON.stringify(await response.json())
  }
}

/**
 * 
 * @param {String} botKey 企业微信机器人密钥
 * @param {String} content 需要发送的内容，支持 Markdown 格式
 * @returns 
 */
async function sendMdMsg(botKey, content) {
  const baseUrl = "https://qyapi.weixin.qq.com/cgi-bin/webhook/"
  const url = `${baseUrl}send?key=${botKey}`
  const init = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "msgtype": "markdown",
      "markdown": {
        "content": content
      }
    })
  }
  const response = await fetch(url, init)
  return await gatherResponse(response)
}

/**
 * 处理请求
 * @param {String} botKey 企业微信机器人密钥
 * @param {JSON} reqBody 语雀传递的请求体
 * @returns 
 */
async function handleMdMsg(botKey, reqBody) {
  const book_name = reqBody.data.book.name; // 知识库名称
  const user_name = reqBody.data.user.name; // 用户名称
  const article_name = reqBody.data.title; // 文档名称
  const article_url = `https://www.yuque.com/${reqBody.data.path}`; // 文档名称
  // 标记事件动作
  const actionWords = {
    "update": "更新",
    "publish": "发布",
    "delete": "删除"
  };
  mdMsg = `[${user_name}] ${actionWords[reqBody.data.action_type]}了【[${article_name}](${article_url})】\n> 来自知识库: ${book_name}`
  return await sendMdMsg(botKey, mdMsg);
}

/**
 * 
 * @param {JSON} request 语雀传递的请求
 * @returns 
 */
async function handleRequest(request) {
  const { searchParams } = new URL(request.url)
  // 从 URL 获取传入的机器人密钥
  let botKey = searchParams.get('key')
  // 从请求中获取消息内容
  var reqBody = await gatherResponse(request)
  var results = await handleMdMsg(botKey, JSON.parse(reqBody))
  return new Response(results)
}

addEventListener("fetch", event => {
  const { request } = event
  // 仅处理 POST 请求
  if (request.method === "POST") {
    return event.respondWith(handleRequest(request))
  }
  else {
    return event.respondWith(new Response("请使用参考使用文档: https://github.com/huhuhang/yuque-wecom-bot"))
  }
})