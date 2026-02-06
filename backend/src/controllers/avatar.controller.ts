import { Request, Response } from 'express';
import https from 'https';

/**
 * Proxy for ui-avatars.com to bypass CORS issues in some environments.
 */
export const proxyAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, background, color, size } = req.query;

        if (!name) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }

        const baseUrl = 'https://ui-avatars.com/api/';
        const params = new URLSearchParams();
        params.append('name', name as string);
        if (background) params.append('background', background as string);
        if (color) params.append('color', color as string);
        if (size) params.append('size', size as string);

        const targetUrl = `${baseUrl}?${params.toString()}`;

        https.get(targetUrl, (remoteRes) => {
            // Check status code
            if (remoteRes.statusCode !== 200) {
                res.status(remoteRes.statusCode || 500).json({ error: 'Failed to fetch avatar' });
                return;
            }

            // Copy headers
            res.setHeader('Content-Type', remoteRes.headers['content-type'] || 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

            // Pipe the response
            remoteRes.pipe(res);
        }).on('error', (err) => {
            console.error('Avatar proxy error:', err);
            res.status(500).json({ error: 'Internal server error fetching avatar' });
        });
    } catch (error) {
        console.error('Avatar proxy catch error:', error);
        res.status(500).json({ error: 'Failed to proxy avatar' });
    }
};
