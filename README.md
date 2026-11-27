# 互联聊天室

这里是互联聊天室的公开成员名单。各站可以读取 `members.json`，用它展示站点介绍、图标和聊天室入口。

## 加入互联的要求

- **接入站点应为博客。** 申请时提供站点主页、公开聊天室链接和能联系到站长的方式。站点和聊天室应能正常访问。
- **站长负责日常管理。** 站点应遵守适用的法律法规。站长应能处理违规内容、用户反馈和跨站投诉。
- **发言必须限流。** 在服务端限制每个发言账号的发送频率，同时给全站的互联转发设置限额。文字、表情、图片和附件都纳入限流。共享转发账号按原发言人分别计数。超限时给出等待提示，避免积压的消息一次性涌入大厅。
- **提前说明同步范围。** 在发言入口明确提示消息会同步到 Matrix 和其他互联站点。同步范围限于双方约定的公开聊天室。私聊、后台记录和用户的非公开资料不得转发。
- **提供临时断联接口。** 接入站点须提供仅授权维护者可调用的接口，用于暂停和恢复本站与互联房间的双向消息同步。若出现刷屏、隐私泄露或误转发，维护者可先暂停互联，确认问题解决后再手动恢复。暂停期间产生的消息不得在恢复后自动补发。

## 以下站点不予接入

- **主要面向境外用户运营的站点。** 审核时参考站点的公开定位、内容和主要受众。可在境外访问或使用境外服务器，本身不作为拒绝依据。
- **公开文章或聊天室内容不符合社会主义核心价值观的站点。** 包括传播违法有害信息、宣扬暴力或仇恨、持续发布人身攻击、骚扰或恶意曝光他人隐私的内容。
- **以广告导流、垃圾信息、诈骗或钓鱼为主要用途的站点。** 擅自采集用户信息、冒用他人身份，或用虚假站点资料申请，也不予接入。
- **缺少基本管理和转发控制的站点。** 未设置服务端限流、未提供可用的临时断联接口，或站长长期无法联系，导致互联问题无法及时处理的，暂不接入。
- **同步范围不明确或未经约定转发的站点。** 包括未告知用户消息会跨站同步、把私聊或非公开资料转入互联房间，以及擅自把互联消息转发到约定之外的房间。

因为缺少告知、限流或临时断联接口而未通过的站点，补齐后可以重新申请。

## 申请加入

1. [提交「申请加入互联聊天室」Issue](https://github.com/Jarvis0227/federated-chat/issues/new?template=join.yml)。
2. 维护者核对资料，并与站长确认 Matrix 接入方式和联调结果。
3. 维护者确认后，给申请 Issue 加上「审核通过」标签。GitHub Actions 会校验表单并创建一条更新 `members.json` 的 PR。
4. 维护者核对 PR 后将它合并到 `main`。合并时会自动关闭原 Issue，站点才正式加入。若申请表修改过，核对后移除再重新添加标签。

## 修改自己的站点资料

请用 `members.json` 中登记的 GitHub 账号提交[「修改我的站点资料」Issue](https://github.com/Jarvis0227/federated-chat/issues/new?template=update.yml)，只填写要更新的字段。维护者用 Issue 作者的 GitHub 用户名匹配当前成员记录，只修改该记录。GitHub 用户名需要更换时，请在 Issue 里说明，由维护者核对归属后更新绑定。

维护者核对资料后，同样给资料更新 Issue 加「审核通过」标签。GitHub Actions 会通过 Issue 作者找到对应成员，只改填写了新值的字段，并创建 PR。未填字段保留原值，切换为 `user` 时清空转发账号。PR 合并后自动关闭原 Issue。GitHub 账号换绑由维护者手动处理。

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
