"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase/clientApp"; // Firebase auth obyektini idxal edin
import { useCallback, useEffect, useState } from "react";
import { redirect } from "next/navigation";

export default function Home() {
  const [user, setUser] = useState<{ email: string; username: string } | null>(null);
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
  useEffect(() => {
    const usersData = getLocalStorageWithExpiry("user");
    if (usersData) {
      console.log(usersData)
      setUser(usersData)
      console.log("Məlumat:", usersData);
    } else {
      console.log("Məlumat mövcud deyil və ya vaxtı keçib.");
    }
  }, [])
  const huquqImtahan=useCallback(()=>{
    redirect('/test')
  },[])
  return (
    <div >
      <h1 className="text-4xl">Home</h1>
      {user && (
        <div className="flex flex-col gap-2">
          <p>User is signed in!</p>
          <p>Welcome,{user.username}!</p>
          <button onClick={huquqImtahan} className="px-6 h-12 uppercase font-semibold tracking-wider border-2 border-black bg-sky-500  text-black" type="submit">
            Kartoqrafiya
          </button>
        </div>
      )}
      {!user && <p>Please sign in to continue.</p>}
    </div>
  );
}
