// 开启服务接口
const express = require('express');
const app = express();
const port = 3000;
const crawl = require('./crawl');

// cors
app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next()
    }
)

app.get('/crawl', async (req, res) => {
    const results = await crawl.filter()
    res.send(JSON.stringify(results));
});

app.get('/candles', async (req, res) => {
    // 获取请求参数
    const id = req.query.id
    const bar = req.query.bar
    const results = await crawl.getCandles([{
        instId: id
    }], bar)
    const result = results.length > 0 ? results[0]['data'] : []
    res.send(JSON.stringify(result));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});