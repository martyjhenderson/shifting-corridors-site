const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
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
        const filePath = event.queryStringParameters?.path;
        
        if (!filePath) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Path parameter is required' })
            };
        }

        // Ensure file path is safe and remove leading slash
        const normalizedPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');
        
        const params = {
            Bucket: BUCKET_NAME,
            Key: normalizedPath
        };

        const command = new GetObjectCommand(params);
        const result = await s3Client.send(command);
        
        // Convert stream to string
        const content = await result.Body.transformToString();

        return {
            statusCode: 200,
            headers: {
                ...headers,
                'Content-Type': 'text/plain; charset=utf-8'
            },
            body: content
        };
    } catch (error) {
        console.error('Error getting file:', error);
        
        if (error.name === 'NoSuchKey') {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'File not found' })
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to get file' })
        };
    }
};