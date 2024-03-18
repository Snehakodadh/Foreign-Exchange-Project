const express = require('express');
const app = express();
const PORT = 3000;
const bodyParser = require('body-parser');
const { DynamoDBClient, PutItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { fromIni } = require("@aws-sdk/credential-provider-ini");

const credentials = fromIni({profile: "sneha_dev"});
const region = "us-east-1";

const dynamoDBClient = new DynamoDBClient({ region, credentials });


app.use(express.json());

app.post('/currencies', async (req, res) => {
    try {
        const { currencyCode, rateAgainstUSD, displayName, currencySymbol } = req.body;

        if (!currencyCode || !displayName || !rateAgainstUSD) {
            return res.status(400).json({ error: 'Missing required request body' });
        }

        const params = {
            TableName: 'dev-test-exchange',
            Item: {
                'currencyCode': { S: currencyCode },
                'rateAgainstUSD': { N: rateAgainstUSD.toString() },
                'displayName': { S: displayName },
                'currencySymbol': { S: currencySymbol }
            }
        };

        await dynamoDBClient.send(new PutItemCommand(params));
        res.status(200).json({ message: 'Currency data inserted successfully' });
    } catch (error) {
        console.error('Error inserting currency data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.put('/currencies/:currencyCode/rate', async (req, res) => {
    try {
        const currencyCode = req.params.currencyCode;
        const { newRateAgainstUSD } = req.body;

        const params = {
            TableName: 'dev-test-exchange',
            Key: { 'currencyCode': { S: currencyCode } }, 
            UpdateExpression: 'SET rateAgainstUSD = :newRate',
            ExpressionAttributeValues: { ':newRate': { N: newRateAgainstUSD.toString() } },
        };

        await dynamoDBClient.send(new UpdateItemCommand(params));
        res.status(200).json({ message: 'Rate updated successfully' });
    } catch (error) {
        console.error('Error updating rate:', error);
        res.status(500).json({ error: 'Failed to update rate' });
    }
});

app.listen(PORT, () => {
    console.log('Server is running on port 3000');
});
