import crypto from 'crypto';

function generateToken() : string {
    const token = crypto.randomBytes(10).toString('hex');
    return token;
}

export { generateToken };