import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import {exec} from "child_process";
import util from "util";
import os from 'os';
import readlineSync from "readline-sync";

const platform  = os.platform();

const execute = util.promisify(exec);

const ai = new GoogleGenAI({});

//Tool that will help to execute commands like mkdir etc. for creating files//
async function executeCommand({command}){
    try{
        const {stdout,stderr} = await execute(command);
        if(stderr){
           return `Error:${stderr}`;
        }
        return `Success ${stdout}`;
    }catch(err){
        return `Error:${err}`;
    }   
}

const commandExecuter = {
    name:"executeCommand",
    description:"It takes any shell or terminal command and execute it.It will help us to create, read, update, write delete any folder and file.",
    parameters:{
        type: "OBJECT",
        properties:{
            command:{
                type:"STRING",
                description:"It is a terminal/Shell command. eg:mkdir calculator, touch calculator/index.html etc."
            }
        },
        required:['command']
    }

}


const History = [];


async function buildWebsite(){
    while(true){

    const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: History,
    config: {
        systemInstruction:`You are a website builder, which will create the frontend part of the website using terminal/shell command.
         You will give shell/terminal command one by one and our tool execute it.

         Give the command according to the Operating system we are using.
         My current operating system is :${platform}

         Kindly use best practice for commands, it should handle multiline write efficiently.

         Your Job
         1:Anaylyse the user query
         2.Take the neccessary action after analysing the query by giving the proper command according to the user operating system.

         Step by step guide
         1:First you have to create the folder for the website which we have to create, Ex:mkdir calculator
         2:Give shell/terminal command to create html file, ex: touch calculator/index.html
         3.Give shell/terminal command to create css file, ex: touch calculator/style.css
         4.Give shell/terminal command to create javascript file, ex: touch calculator/app.js
         5.Give shell/terminal command to write on html file.
         6.Give shell/terminal command to write on css file.
         7.Give shell/terminal command to write on javascript file.
         8.Fix the error if they are present at any step by writing, updating and deleting.
        `,
        tools:[{functionDeclarations: [commandExecuter]}]
    },
    });

    const functionCalls = response.functionCalls;
    if (response.functionCalls && response.functionCalls.length > 0){
        const functionCall = response.functionCalls[0];
        const {name,args} = functionCall;
        const toolResponse = await executeCommand(args);
        
        const functionResponsePart = {
          name: functionCall.name,
          response: {
            result: toolResponse,
          },
        };

        // Send the function response back to the model.
        History.push({
          role: "model",
          parts: [
            {
              functionCall: functionCall,
            },
          ],
        });

        History.push({
          role: "user",
          parts: [
            {
              functionResponse: functionResponsePart,
            },
          ],
        });
    }else{
        console.log(response.text);
        History.push({
            role:'model',
            parts:[{text:response.text}]
        })
        break;
    }
}
}

while(true){
    const question = readlineSync.question("Ask me anything->");
    
    if(question=='exit'){
       break;
    }
    History.push({
        role:'user',
        parts:[{text:question}]
    })
    await buildWebsite();
}
