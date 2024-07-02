const axios = require('axios');
const {SocksProxyAgent} = require('socks-proxy-agent');
const pLimit = require('p-limit');

// Replace with your SOCKS proxy server details
const proxyHost = '127.0.0.1';
const proxyPort = 1080; // Replace with your SOCKS proxy port
// Create a SOCKS5 proxy agent
const proxyAgent = new SocksProxyAgent(`socks5://${proxyHost}:${proxyPort}`);


async function getAllCoins() {
    const timestamp = Date.now();
    const url = `https://www.okx.com/priapi/v5/public/simpleProduct?instType=SWAP&includeType=1&t=${timestamp}`;
    const response = await axios.get(url, {
        httpsAgent: proxyAgent
    })
    return response.data
}

async function getCandles(coins, bar, max = 100) {
    // 获取1个月前的时间戳
    const oneMonthAgo = new Date();
    const now = Date.now();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoTimestamp = oneMonthAgo.getTime();

    const urls = coins.map(coin => `https://www.okx.com/priapi/v5/market/candles?instId=${coin.instId}&before=${oneMonthAgoTimestamp}&bar=${bar}&limit=${max}&t=${now}`);
    // 设置并发限制，例如 5
    const limit = pLimit(10);
    // 创建请求任务并应用并发限制
    const requests = urls.map(url => limit(() => axios.get(url, {
        httpsAgent: proxyAgent
    })));

    try {
        const responses = await Promise.all(requests);
        return responses.map(response => response.data);
    } catch (error) {
        console.log(error, 'error')
        return []
    }
}

async function filter() {
    const allCoins = await getAllCoins();
    const candles = await getCandles(allCoins.data.filter(coin=>coin['settleCcy'] === 'USDT'), '30m', 5);
    const results = [];
    for (let i = 0; i < candles.length; i++) {
        try {
            const openPrice = +candles[i]['data'][1][1]
            const closePrice = +candles[i]['data'][1][4]
            const percent = (closePrice - openPrice) / openPrice * 100
            if (Math.abs(percent) > 1) {
                results.push({
                    ctValCcy: allCoins.data[i].ctValCcy,
                    instId: allCoins.data[i].instId,
                })
            }
        } catch (e) {

        }

    }
    return results
}

module.exports = {
    filter,
    getCandles
}