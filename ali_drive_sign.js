const axios = require('axios');

class AliyunDriveSigner {
    constructor(refreshToken) {
        this.refreshToken = refreshToken;
        this.accessToken = null;
    }

    // 刷新access_token‌:ml-citation{ref="5" data="citationList"}
    async refreshAccessToken() {
        try {
            const response = await axios.post('https://auth.aliyundrive.com/v2/account/token', {
                grant_type: "refresh_token",
                refresh_token: this.refreshToken
            });
            this.accessToken = response.data.access_token;
            return true;
        } catch (error) {
            console.error(`[${this.refreshToken.slice(-4)}] Token刷新失败:`, error.response?.data?.message || error.message);
            return false;
        }
    }

    // 完整签到流程‌:ml-citation{ref="1,4" data="citationList"}
    async execute() {
        if (!await this.refreshAccessToken()) return;
        
        try {
            // 执行签到
            const signRes = await axios.post(
                'https://member.aliyundrive.com/v1/activity/sign_in_list',
                { "_rx-s": "mobile" },
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 AliApp(AliYunDingTalk/6.0.0)',
                        'x-client-version': '6.0.0'  // 新增版本标识‌:ml-citation{ref="5" data="citationList"}
                    }
                }
            );

            // 领取奖励
            const rewardRes = await axios.post(
                'https://member.aliyundrive.com/v1/activity/sign_in_reward',
                { "signInDay": signRes.data.result.signInCount, "_rx-s": "mobile" },
                { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
            );

            return {
                success: true,
                signInCount: signRes.data.result.signInCount,
                reward: rewardRes.data.result
            };
        } catch (error) {
            console.error(`[${this.refreshToken.slice(-4)}] 执行异常:`, error.response?.data?.message || error.message);
            return { success: false };
        }
    }
}

// 通过环境变量获取token‌:ml-citation{ref="2,3" data="citationList"}
const refreshTokens = process.env.ALIYUNDRIVE_REFRESH_TOKEN?.split('#') || [];
if (refreshTokens.length === 0) {
    console.error('未检测到环境变量 ALIYUNDRIVE_REFRESH_TOKEN');
    process.exit(1);
}

// 执行多账户签到‌:ml-citation{ref="1,5" data="citationList"}
Promise.all(refreshTokens.map(token => {
    return new AliyunDriveSigner(token.trim()).execute();
})).then(results => {
    console.log('最终签到结果:');
    results.forEach((result, index) => {
        console.log(`账号${index + 1}:`, result.success ? 
            `成功签到${result.signInCount}天，获得${result.reward.name}` : 
            '签到失败');
    });
    process.exit(results.every(r => r.success) ? 0 : 1);
});
