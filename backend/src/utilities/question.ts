import { createInterface } from "readline";

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (question: string): Promise<string> => 
    new Promise((resolve) => {
        rl.question(question, (answer: string) => {
            resolve(answer);
        });
    });

export default question;