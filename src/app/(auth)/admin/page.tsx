"use client";
import "../../globals.css"
import { useRef, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "../../../../firebase/clientApp";

interface Question {
    question: string;
    answers: string[];
    correctAnswer: string | null;
}

const Admin = () => {
    const [text, setText] = useState<string>("");
    const [json, setJson] = useState<Question[]>([]);
    const nameExam = useRef<HTMLInputElement | null>(null);
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const extractQuestions = () => {
        const lines = text.split("\n");
        const questions: Question[] = [];
        let currentQuestion: Question | null = null;
        const answersTracker: Set<string> = new Set();  // To track already added answers for a question
    
        let isAnswerBeingProcessed = false;  // Flag to track if an answer is already being processed
    
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
    
            // Detect new question based on a number followed by a period (e.g., "17.")
            if (/^\d+\./.test(trimmedLine)) {
                const currentNumber = parseInt(trimmedLine.split(".")[0]);
                const previousNumber = currentQuestion ? parseInt(currentQuestion.question.split(".")[0]) : null;
    
                // If it's a new question, finalize the current one and start a new question
                if (!previousNumber || currentNumber === previousNumber + 1) {
                    if (currentQuestion) {
                        questions.push(currentQuestion);
                    }
                    currentQuestion = {
                        question: trimmedLine,  // Store the current question
                        answers: [],
                        correctAnswer: null,
                    };
                    answersTracker.clear(); // Reset the tracker for the new question
                } else {
                    // If it seems like a continuation of the previous question, append to it
                    if (currentQuestion) {
                        currentQuestion.question += " " + trimmedLine;
                    }
                }
            }
            // Detect answers based on special symbols (e.g., "√", "•", or numbers)
            else if (/^(√|•|\d+,)/.test(trimmedLine)) {
                if (currentQuestion) {
                    const isCorrect = trimmedLine.startsWith("√");
                    let cleanLine = trimmedLine.replace(/^(√|•|\d+,)/, "").trim();
    
                    // If the answer is already being processed, we don't need to reprocess it
                    if (answersTracker.has(cleanLine)) {
                        return;  // Skip if it's already in the tracker
                    }
    
                    // Handle multiline answers by checking for the next question or answer
                    let nextIndex = index + 1;
                    while (nextIndex < lines.length && !/^\d+\./.test(lines[nextIndex]) && !/^(√|•|\d+,)/.test(lines[nextIndex])) {
                        cleanLine += " " + lines[nextIndex].trim();
                        nextIndex++;
                    }
    
                    // Add the correct answer if needed
                    if (isCorrect) {
                        currentQuestion.correctAnswer = cleanLine;
                    }
    
                    // Add the answer to the question if it's unique
                    currentQuestion.answers.push(cleanLine);
                    answersTracker.add(cleanLine);  // Mark this answer as added
    
                    // Once added, stop further processing on this answer by setting flag to false
                    isAnswerBeingProcessed = true;
    
                    return;  // Skip the remaining code for this line, since the answer is now handled
                }
            }
            // If it's part of an ongoing answer, continue adding it to the current answer
            else {
                if (currentQuestion && !isAnswerBeingProcessed) {
                    let lastAnswer = currentQuestion.answers[currentQuestion.answers.length - 1];
    
                    if (lastAnswer && lastAnswer !== trimmedLine) {
                        lastAnswer += " " + trimmedLine;
                        currentQuestion.answers[currentQuestion.answers.length - 1] = lastAnswer;
                    } else if (!lastAnswer || lastAnswer !== trimmedLine) {
                        // If it's a new answer, add it and mark it as processed
                        currentQuestion.answers.push(trimmedLine);
                        answersTracker.add(trimmedLine);  // Mark this part as added
    
                        // Set the flag to prevent adding the same answer again
                        isAnswerBeingProcessed = true;
    
                        return;  // Skip further processing for this part
                    }
                }
            }
        });
    
        // Finalize the last question if it exists
        if (currentQuestion) {
            questions.push(currentQuestion);
        }
    
        // Set the JSON with the extracted questions and answers
        setJson(questions);
    };
    

    const firebase = () => {
        const id = uuidv4();
        const saveData = async () => {
            if (nameExam.current && nameExam.current.value) {
                try {
                    await setDoc(doc(firestore, "exam", id), {
                        json,
                        examName: nameExam.current.value
                    });
                    alert("Success");
                } catch (e) {
                    console.error("Error writing document: ", e);
                }
            };
        }
        saveData();
    };

    return (
        <div style={{ height: "100vh" }} className="mt-10 pt-10 bg-red container flex flex-col gap-1">
            <textarea
                className="text-black"
                value={text}
                onChange={handleTextChange}
                rows={10}
                cols={50}
                placeholder="PDF mətnini bura yapışdırın"
            />
            <input type="text" placeholder="movzunun adi" className="p-1 text-black" ref={nameExam} />
            <button
                onClick={extractQuestions}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
                Sualları Çıxar
            </button>

            <button
                onClick={firebase}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
                Firebase
            </button>
            {json.map((item, index) => (
                <div style={{ marginTop: "20px" }} className="p-1" key={index}>
                    <p>{item.question.replace(/\.$/, "")}</p>
                    <ul>
                        {item.answers.map((answer, idx) => (
                            <li key={idx}>
                                <label className="text-white">
                                    <input
                                        type="radio"
                                        name={`question-${index}`}
                                        value={answer}
                                        className="bg-white focus:bg-blue-200"
                                    />
                                    {answer}
                                </label>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-2 space-x-2">
                        <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400">
                            Yaddaşda saxla
                        </button>
                        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
                            Cavabı göstər
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Admin;

