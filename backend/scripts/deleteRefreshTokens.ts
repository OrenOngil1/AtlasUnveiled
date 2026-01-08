import { db } from '../src/db/connection';
import { refreshTokensTable } from '../src/db/schema';
import question from '../src/utilities/question';

const deleteRefreshTokens = async() => {
    console.log("========== Deleting all refresh tokens ==========");
    console.log("This will remove all existing refresh tokens from the database.");
    
    const answer = await question("Are you sure you want to proceed? (y/n): ");
    if(answer.toLowerCase() === 'n') {
        console.log("Operation cancelled by user.");
        console.log("=================================================");
        process.exit(0);
    }

    try {
        await db.delete(refreshTokensTable);
        console.log("All existing refresh tokens have been deleted.");
    } catch (error) {
        console.error("Error deleting refresh tokens:", error);
        process.exit(1);
    }

    console.log("=================================================");
};

deleteRefreshTokens();