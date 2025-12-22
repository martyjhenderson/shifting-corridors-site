const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const BUCKET_NAME = process.env.CONTENT_BUCKET_NAME;

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const directory = event.queryStringParameters?.directory;
        
        if (!directory) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Directory parameter is required' })
            };
        }

        // Ensure directory path is safe
        const normalizedDir = directory.replace(/\.\./g, '').replace(/^\/+/, '');
        
        const params = {
            Bucket: BUCKET_NAME,
            Prefix: `${normalizedDir}/`,
            Delimiter: '/'
        };

        const result = await s3.listObjectsV2(params).promise();
        
        // Filter for markdown files and extract just the filename
        const markdownFiles = result.Contents
            .filter(obj => obj.Key.endsWith('.md'))
            .map(obj => obj.Key.split('/').pop())
            .filter(filename => filename); // Remove any undefined values

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(markdownFiles)
        };
    } catch (error) {
        console.error('Error listing files:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to list files' })
        };
    }
};