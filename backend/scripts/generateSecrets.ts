import crypto from 'crypto';
import { db } from '../src/db/connection';
import { refreshTokensTable } from '../src/db/schema';
import { sql } from 'drizzle-orm';

const generateSecrets = async() => {
    console.log("========== Generating new secrets ==========");

    console.log(`WARNING: To make the new secrets effective, you must also invalidate all existing refresh tokens in the database.`);
    console.log(`This is necessary to prevent unauthorized access using old tokens.`);
    console.log(`If you don't want to invalidate existing tokens, reuse the old secrets instead of the newly generated ones.`);
    console.log(`To prevent invalidating existing tokens, keep the old secrets and abort this operation.\n`);

    const secretAccess = crypto.randomBytes(64).toString('hex');
    const secretRefresh = crypto.randomBytes(64).toString('hex');

    console.log(`To apply these new secrets, you must set the following environment variables in your deployment environment:\n`);
    console.log(`SECRET_ACCESS=${secretAccess}`);
    console.log(`SECRET_REFRESH=${secretRefresh}\n`);
    console.log(`To invalidate existing refresh tokens, run the appropriate script in deleteRefreshTokens.ts`);
    console.log(`============================================`);
};

generateSecrets();
