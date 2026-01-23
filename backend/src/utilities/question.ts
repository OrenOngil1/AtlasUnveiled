import { createInterface } from "readline";

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Prompts user for input via readline
 * @param {string} question - Question to display
 * @returns {Promise<string>} User's input
 */
const question = (question: string): Promise<string> => 
    new Promise((resolve) => {
        rl.question(question, (answer: string) => {
            resolve(answer);
        });
    });

export default question;