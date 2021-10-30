const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios');

const asciichart = require('asciichart');

const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();

const env = require('dotenv');
env.config();

const CHANNEL_NAME = 'cryptos'
const TIME = [
    { name: 'hour', value: 60 * 60 },
    { name: 'day', value: 60 * 60 * 24 },
    { name: 'week', value: 60 * 60 * 24 * 7 },
    { name: 'month', value: 60 * 60 * 24 * 30 },
    { name: 'year', value: 60 * 60 * 24 * 365 },
]

client.login(process.env.DISCORD_TOKEN);

client.on('ready', async () => {
    console.log('Crypto bot ready for serrrrrvice!');
});

client.on('message', msg => {
    if (msg.channel.name.toLowerCase() !== CHANNEL_NAME) return;
    const { content } = msg;
    if (content.startsWith('/')) {
        const split = content.toLowerCase().split(" ");
        const slug = split[0].replace('/', '');
        const len = split.length;
        if (slug === 'gang') {
            const gang = ['bitcoin', 'ethereum', 'ripple'];
            gang.forEach(val => {
                getCryptoData(msg, val, len > 1 ? split[1] : 'day', split.length >= 2 ? split[2] : false);
            })
            deleteMsg(msg);
            return;
        }
        getCryptoData(msg, slug, len > 1 ? split[1] : 'day', split.length >= 2 ? split[2] : false, true);
    }
});

relDiff = (a, b) => {
    return (100 * (a - b) / ((a + b) / 2)).toFixed(2) + '%';
}

simplifyData = (array, amount) => {
    const arr = array.filter(function (value, index) {
        return (index + 1) % amount === 0 || index === array.length - 1 || index === 0;
    });
    const newArr = [];
    arr.forEach(val => newArr.push(val[1]))
    return newArr;
}

getCryptoData = async (msg, cryptoName, query, opts, del) => {
    const date = Math.floor(Date.now() / 1000);
    const diff = TIME.find(val => val.name === query);
    if (!diff) {
        msg.reply(`Try syntax: /[coin name] [hour, day, week, month, year] [-c]`);
        deleteMsg(msg);
        return;
    }
    const chartData = await CoinGeckoClient.coins.fetchMarketChartRange(cryptoName, {
        from: date - diff.value,
        to: date,
    });
    if (chartData.success === false) {
        msg.reply(`Couldn't find that coin, please use full name not abbreviations.`);
        deleteMsg(msg);
        return;
    }
    const chartPriceData = chartData.data.prices;
    const price = await CoinGeckoClient.simple.price({
        ids: [cryptoName],
        vs_currencies: ['usd'],
    });
    const realPriceNoRound = price.data[cryptoName].usd;
    const realPrice = +realPriceNoRound > 1 ? `$${realPriceNoRound.toFixed(2)}` : `$${realPriceNoRound.toFixed(6)}`
    switch (query) {
        case 'hour':
        case 'day':
        case 'week':
        case 'month':
        case 'year':
            if (opts === '-c') {
                msg.channel.send('```' + asciichart.plot(simplifyData(chartPriceData, 30), { height: 6 }) +
                    `
                ${cryptoName.toUpperCase()} over the last ${query}. Current price: ${realPrice}.
                `+ '```');
            }
            else {
                msg.channel.send(`${cryptoName.toUpperCase()} price change over the last ${query}: ${relDiff(chartPriceData[chartPriceData.length - 1][1], chartPriceData[0][1])}. Current price: ${realPrice}.`)
            }
            if (del) deleteMsg(msg);
            return;
        default:
            msg.reply(`Try syntax: /[coin name] [hour, day, week, month, year] [-c]`);
            deleteMsg(msg);
            return;
    }
}

deleteMsg = (msg) => {
    setTimeout(() => {
        msg.delete();
    }, 1500)
}
