"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../../firebase/clientApp";

interface Question {
  examName: string;
  data: string;
}

export default function Home() {
  const [user, setUser] = useState<{ email: string; username: string } | null>(null);
  const [exam, setExam] = useState<Question[]>([]);
  const router = useRouter(); 

  const getLocalStorageWithExpiry = (key: string) => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
      return null;
    }

    const item = JSON.parse(itemStr);
    const now = new Date();
    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return item.value;
  };

  const fetchCollectionData = async () => {
    const querySnapshot = await getDocs(collection(firestore, "exam"));
    const fetchedJson: Question[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const question: Question = {
        examName: data.examName,
        data: data.json || '',
      };
      fetchedJson.push(question);
    });
    console.log(fetchedJson);
    setExam(fetchedJson);
  };

  useEffect(() => {
    fetchCollectionData();
    const usersData = getLocalStorageWithExpiry("user");
    if (usersData) {
      setUser(usersData);
    } else {
      console.log("Məlumat mövcud deyil və ya vaxtı keçib.");
    }
  }, []);

  const imtahan = useCallback((data: string) => {
    router.push(`${data}`); 
  }, [router]);

  return (
    <div>
      <h1 className="text-4xl">Home</h1>
      {user && (
        <div className="flex flex-col gap-2">
          <p>User is signed in!</p>
          <p>Welcome, {user.username}!</p>
          {exam.length > 0 ? (
            exam.map((data, index) => (
              <div key={`${data.examName}-${index}`} className="flex flex-row">
                <button
                  onClick={() => {
                    try {
                      imtahan(data.examName);
                    } catch (error) {
                      console.error("Error in imtahan function:", error);
                    }
                  }}
                  className="px-6 h-12 uppercase font-semibold tracking-wider border-2 border-black bg-sky-500 text-black"
                  type="button"
                >
                  {data.examName}
                </button>
              </div>
            ))
          ) : (
            <p>No exams available</p>
          )}
        </div>
      )}
      {!user && <p>Please sign in to continue.</p>}
    </div>
  );
}
