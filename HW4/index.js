'use strict';
const line = require('@line/bot-sdk')
const express = require('express'),
    configGet = require('config');
const { TextAnalyticsClient, AzureKeyCredential} = require("@azure/ai-text-analytics");

const app = express();

const configLine = {
    channelAccessToken:configGet.get('CHANNEL_ACCESS_TOKEN'),
    channelSecret:configGet.get('CHANNEL_SECRET')
};

// create LINE SDK client
const client = new line.Client(configLine);

//Azure Text Sentiment
const endpoint = configGet.get("ENDPOINT");
const apiKey = configGet.get("TEXT_ANALYTICS_API_KEY");

const port = process.env.PORT || process.env.port || 3000;

app.listen(port, ()=>{
    console.log(`listening on ${port}`);
});

app.post('/callback', line.middleware(configLine),(req,res)=>{
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result)=>res.json(result))
        .catch((err)=>{
            console.error(err);
            res.status(500).end();
        });
});

function handleEvent(event){
    if(event.type !=='message' || event.message.type !== 'text'){
        return Promise.resolve(null);
    }

    MS_TextSentimentAnalysis(event)
    .catch((err) =>{
    console.error("Error:", err);
    });
}




async function MS_TextSentimentAnalysis(thisEvent){
    console.log("[MS_TextSentimentAnalysis] in");
    const analyticsClient = new TextAnalyticsClient(endpoint, new AzureKeyCredential(apiKey));

    let documents = [];
    documents.push(thisEvent.message.text);

    const results = await analyticsClient.analyzeSentiment(documents, "zh-hant",{
        includeOpinionMining:true
    });
    console.log("[results] ", JSON.stringify(results));


    const sentimentScore = results[0].confidenceScores[results[0].sentiment];
    const sentimentText = results[0].sentiment;
    let mainOpinions = results[0].sentences[0]?.opinions[0]?.target?.text;
    
    if (mainOpinions === undefined) {
        mainOpinions = "沒有主題啦哈哈";
    }
    
    const sentimentTextMap = {
        "positive": "正面",
        "negative": "負面",
        "neutral": "中立"
      };


    const echo = {
        type: 'text',
        text: `主題：${mainOpinions}\n情緒：${sentimentTextMap[sentimentText]}\n指數：${sentimentScore[highestSentiment]}`
      };
      return client.replyMessage(thisEvent.replyToken, echo);

}
