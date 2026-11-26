# 互联聊天室

这里是互联聊天室的公开成员名单。各站可以读取 `members.json`，用它展示站点介绍、图标和聊天室入口。

## 申请加入

1. [提交「申请加入互联聊天室」Issue](https://github.com/Jarvis0227/federated-chat/issues/new?template=join.yml)。
2. 维护者核对资料，并与站长确认 Matrix 接入方式和联调结果。
3. 审核通过后，维护者更新 `members.json`，并在 Issue 里告知申请人。

## 成员名单

`members.json` 是成员对象数组。名单中的每条记录都包含以下十二个字段，结构定义见 [`members.schema.json`](members.schema.json)。

| 字段 | 填写说明 |
| --- | --- |
| `siteName` | 站点正式名称。 |
| `siteDescription` | 用一两句话介绍站点或聊天室。 |
| `siteUrl` | 填写完整网址。 |
| `chatName` | 聊天室自己的名称，例如「听雨茶室」或「清吾长亭」。 |
| `chatUrl` | 填写完整网址。 |
| `siteIconUrl` | 填写可公开访问的图标图片直链。 |
| `homeserver` | 填写服务器名，可带端口，省略协议和路径。 |
| `color` | 填写可直接用于 CSS color 和 background-color 的颜色值，例如 #b86b91。 |
| `matrixUserId` | 填写站长本人的完整 Matrix 用户 ID，格式为 @用户名:服务器名。 |
| `githubUsername` | 站长本人的 GitHub 用户名，例如 `Jarvis0227`，省略 @ 和网址。 |
| `matrixAccountType` | user 表示各自使用独立账号，relay 表示共享转发账号。 |
| `matrixRelayUserId` | 选择 relay 时必填，填写实际代发消息账号的完整 ID。选择 user 时留空。 |

```json
{
  "siteName": "示例聊天室",
  "siteDescription": "分享技术和生活，欢迎来聊天室串门。",
  "siteUrl": "https://example.org/",
  "chatName": "示例长亭",
  "chatUrl": "https://example.org/chat/",
  "siteIconUrl": "https://example.org/icon.png",
  "homeserver": "matrix.example.org",
  "color": "#b86b91",
  "matrixUserId": "@owner:matrix.example.org",
  "githubUsername": "example-owner",
  "matrixAccountType": "user",
  "matrixRelayUserId": ""
}
```

使用共享转发账号时，将 `matrixAccountType` 填为 `relay`，并填写实际的 `matrixRelayUserId`。使用独立账号时，将 `matrixAccountType` 填为 `user`，并将 `matrixRelayUserId` 保存为空字符串。

消息和已读回执通过 Matrix 同步。各站维护者根据联调结果配置桥接权限。请将访问令牌和密码保存在服务端。
