"use client";
import '../../globals.css';
import { useCallback, useEffect, useRef, useState } from "react";
import { collection, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { firestore } from "../../../../firebase/clientApp";
import trueImg from "../../../image/true.png";
import Image from 'next/image';
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface Question {
  question: string;
  answers: string[];
  correctAnswer: string | null;
}

const QuestionExtractor = () => {
  const [number, setNumber] = useState<boolean>(false);
  const [question, setQuestion] = useState<boolean>(false);
  const [correct, setCorrect] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [user, setUser] = useState<Question[]>([]);
  const [finish, setFinish] = useState<boolean>(false);
  const [json, setJson] = useState<Question[]>([]);
  const [saveQuestionsNumber, setSaveQuestionsNumber] = useState<string[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const startNumber = useRef<HTMLInputElement | null>(null);
  const endNumber = useRef<HTMLInputElement | null>(null);
  const [examResult, setExamResult] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});

  const fetchCollectionData = async () => {
    const querySnapshot = await getDocs(collection(firestore, "exam"));
    const fetchedJson: Question[] = [];
    querySnapshot.forEach((doc) => {
      fetchedJson.push(...doc.data().json);
    });
    setJson(fetchedJson);
  };

  useEffect(() => {
    const fetchCollectionUser = async () => {
      const querySnapshot = await getDocs(collection(firestore, "users"));
      const fetchedUsers: { saveQuestions: string[], email: string }[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data?.saveQuestions && data.values.email === email) {
          fetchedUsers.push({
            saveQuestions: data.saveQuestions,
            email: data.values.email
          });
        }
      });

      if (fetchedUsers.length > 0) {
        setSaveQuestionsNumber(fetchedUsers[0].saveQuestions);
      }
    };

    if (email) {
      fetchCollectionUser();
    }
  }, [email]);

  useEffect(() => {
    const parsedUser = localStorage.getItem("user");
    if (parsedUser) {
      const userObject = JSON.parse(parsedUser);
      const userEmail = userObject.value.email;
      setEmail(userEmail);
    }
    fetchCollectionData();
  }, []);

  const questionsInMemory = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setQuestion(!question);
  }, [question]);

  const startExam = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setFinish(false);
    setCorrect("")
    if (!question) {
      const start = startNumber.current?.value ? parseInt(startNumber.current.value) : 0;
      const end = endNumber.current?.value ? parseInt(endNumber.current.value) : 0;

      if (start && end) {
        const rangeQuestions = json.slice(start - 1, end);
        const randomQuestions = shuffleArray(rangeQuestions).slice(0, end - start + 1);
        const shuffledQuestionsWithAnswers = randomQuestions.map((item) => ({
          ...item,
          answers: shuffleArray(item.answers)
        }));
        setFilteredQuestions(shuffledQuestionsWithAnswers);
        setNumber(true);
      }
    } else {
      if (saveQuestionsNumber.length) {
        const filteredSavedQuestions = json.filter((item) =>
          saveQuestionsNumber.includes(item.question.split('.')[0])
        );
        setFilteredQuestions(filteredSavedQuestions);
        setNumber(true);
        setQuestion(false);
      } else {
        alert("Yaddaşda sual yoxdur");
      }
    }
  }, [json, question, saveQuestionsNumber]);

  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const showAnswer = (item: { correctAnswer: string | null }) => {
    if (item.correctAnswer) {
      setCorrect(item.correctAnswer);
    } else {
      setCorrect("");
    }
  };

  const saveMemory = (question: Question) => {
    const questionNumber = question.question.split('.')[0];
    setSaveQuestionsNumber((prevNumbers) =>
      prevNumbers.includes(questionNumber)
        ? prevNumbers.filter((n) => n !== questionNumber)
        : [...prevNumbers, questionNumber]
    );
  };

  const endOfExam = async () => {
    if (!finish) {
      if (confirm("İmtahanı bitirəsiniz?")) {
        try {
          await updateDoc(doc(firestore, "users", email), {
            saveQuestions: saveQuestionsNumber,
          });
          console.log("Sənəd uğurla yazıldı!");
        } catch (e) {
          console.error("Sənəd yazılarkən xəta baş verdi: ", e);
        }
        setFinish(true);
        let count = 0;
        filteredQuestions.forEach((item, index) => {
          const selectedAnswer = userAnswers[index];
          if (selectedAnswer === item.correctAnswer) {
            count++;
          }
        });
        setExamResult(count);
        alert(`You answered ${count} out of ${filteredQuestions.length} questions correctly.`);
      }
    } else {
      setNumber(false);
      setFinish(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionIndex]: answer,
    }));
  };

  return (
    <div className="pt-10 h-screen">
      {number ? (
        filteredQuestions.map((item, index) => (
          <div style={{ marginTop: "20px" }} className="p-1" key={index}>
            <p>{index + 1}{item.question.replace(/^\d+\s*/, "")}</p>
            <ul>
              {item.answers.map((answer, idx) => (
                <li key={idx}>
                  <label className="flex">
                    <input
                      onChange={() => handleAnswerChange(index, answer)}
                      type="radio"
                      name={`question-${index}`}
                      value={answer}
                      className="bg-white focus:bg-blue-200"
                    />
                    {answer !== item.correctAnswer ? (
                      <span>{answer}</span>
                    ) : (
                      <div className="flex">
                        {(correct === answer || finish) && (
                          <Image src={trueImg} alt="correct answer" width={20} height={20} />
                        )}
                        <span className={`${correct === answer ? "text-green-500 font-bold" : ""}`}>{answer}</span>
                      </div>
                    )}
                  </label>
                </li>
              ))}
              <div className="mt-2 space-x-2">
                <button onClick={() => saveMemory(item)} className={`
                  px-4 py-2 
                  ${saveQuestionsNumber.includes(item.question.split('.')[0]) ? 'bg-green-500 hover:bg-green-600 focus:ring-green-400' : 'bg-red-500 hover:bg-red-600 focus:ring-red-400'}
                  text-white rounded-lg focus:outline-none focus:ring-2
                `}>
                  {saveQuestionsNumber.includes(item.question.split('.')[0]) ? (
                    <span>Yadda saxlanıldı</span>
                  ) : (
                    <span>Yadda saxla</span>
                  )}
                </button>
                <button onClick={() => showAnswer(item)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  Cavabı göstər
                </button>
              </div>
            </ul>
            <button onClick={endOfExam} className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 mt-2">
              {!finish ? (<span>İmtahanı bitir</span>) : (<span>Geri Qayıt</span>)}
            </button>
          </div>
        ))
      ) : (
        <div className="mt-10 p-5 flex justify-center items-center bg-gray-300">
          <form className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg space-y-6">
            {!question ? (
              <div>
                <label className="block text-lg font-semibold mb-2 text-black">Max 50 sual seçilə bilər</label>
                <div className="flex space-x-4">
                  <input ref={startNumber}
                    type="number"
                    placeholder="Başlanğıc sual"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                  <input ref={endNumber}
                    type="number"
                    placeholder="Son sual"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
              </div>
            ) : (
              <p className="text-center mt-6 text-lg text-gray-700">Yaddaşdakı sual seçildi</p>
            )}

            <div className="flex space-x-4">
              <button onClick={questionsInMemory} className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition">
                {!question ? "Yaddaşdakı suallar" : "Aralıqla daxil edin"}
              </button>
              <button onClick={startExam} className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition">
                İmtahana Başla
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default QuestionExtractor;
