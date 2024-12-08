"use client";
import "../../globals.css"
import { useState } from "react";
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
    console.log(json);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const extractQuestions = () => {
        const lines = text.split("\n");
        const questions: Question[] = [];
        let currentQuestion: Question | null = null;

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();

            // Detect a new question (e.g., "29.")
            if (/^\d+\./.test(trimmedLine)) {
                const currentNumber = parseInt(trimmedLine.split(".")[0]);
                const previousNumber = currentQuestion && parseInt(currentQuestion.question.split(".")[0]);

                if (!previousNumber || currentNumber === previousNumber + 1) {
                    if (currentQuestion) {
                        questions.push(currentQuestion);
                    }
                    currentQuestion = {
                        question: trimmedLine,
                        answers: [],
                        correctAnswer: null,
                    };
                } else {
                    if (currentQuestion) {
                        currentQuestion.question += " " + trimmedLine;
                    }
                }
            } else if (/^(√|•|\d+,)/.test(trimmedLine)) {
                // Handle answers (either correct or regular)
                if (currentQuestion) {
                    const isCorrect = trimmedLine.startsWith("√");
                    let cleanLine = trimmedLine.replace(/^(√|•|\d+,)/, "").trim();

                    let nextIndex = index + 1;
                    // Continue collecting lines until another answer or question is encountered
                    while (nextIndex < lines.length && !/^(√|•|\d+\.)/.test(lines[nextIndex])) {
                        cleanLine += " " + lines[nextIndex].trim();
                        nextIndex++;
                    }

                    if (isCorrect) {
                        currentQuestion.correctAnswer = cleanLine;
                    }
                    currentQuestion.answers.push(cleanLine);
                }
            } else {
                // Handle additional lines for the current question
                if (currentQuestion) {
                    currentQuestion.question += " " + trimmedLine;
                }
            }
        });

        if (currentQuestion) {
            questions.push(currentQuestion);
        }

        setJson(questions);
    };

    const firebase = () => {
        const id = uuidv4();
        const saveData = async () => {
            try {
                await setDoc(doc(firestore, "exam", id), { json });
                alert("Success");
            } catch (e) {
                console.error("Error writing document: ", e);
            }
        };
        saveData();
    };

    return (
        <div style={{ height: "100vh" }} className="mt-10 pt-10 bg-red">
            <textarea
                className="text-black"
                value={text}
                onChange={handleTextChange}
                rows={10}
                cols={50}
                placeholder="PDF mətnini bura yapışdırın"
            />
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
                                <label>
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
