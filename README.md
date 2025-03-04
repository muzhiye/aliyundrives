变量：
ALIYUNDRIVE_REFRESH_TOKEN = "your_token1#your_token2"  # 多账户用#分隔‌:ml-citation{ref="3" data="citationList"}

在青龙面板的「依赖管理」中添加：
Node.js 依赖：axios

添加定时任务：
# 每天上午8点执行
0 8 * * * task ali_drive_sign.js

获取refresh_token：
登录阿里云盘网页版
浏览器控制台执行JSON.parse(localStorage.token).refresh_token