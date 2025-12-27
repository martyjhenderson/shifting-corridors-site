const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

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

        const command = new ListObjectsV2Command(params);
        const result = await s3Client.send(command);
        
        // Filter for markdown files and extract just the filename
        const markdownFiles = (result.Contents || [])
            .filter(obj => obj.Key && obj.Key.endsWith('.md'))
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