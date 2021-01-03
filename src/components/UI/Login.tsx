import React, { Dispatch, SetStateAction, useState } from "react";
import { createNewWindow, legendary } from "../../helper";

interface Props {
  user: string;
  refresh: Dispatch<SetStateAction<boolean>>;
}

export default function Login({ user, refresh }: Props) {
  const [input, setInput] = useState("Paste the SID number here");
  const [status, setStatus] = useState({
    loading: false,
    message: "",
  });
  const {loading, message} = status;

  const loginUrl = "https://www.epicgames.com/id/login?redirectUrl=https%3A%2F%2Fwww.epicgames.com%2Fid%2Fapi%2Fredirect"

  const handleLogin = async (sid: string) => {
    setStatus({
      loading: true,
      message: "Logging In...",
    });
    
    await legendary(`auth --sid ${sid}`);
    setStatus({ loading: true, message: "Loading Game list" });
    refresh(true);
    await legendary(`list-games`);
    refresh(false);
    setStatus({ loading: false, message: "Games Loaded!" });
  };

  const handleLogout = async () => {
    setStatus({
      loading: true,
      message: "Logging Out...",
    });
    await legendary(`auth --delete`);
    refresh(true);
    setStatus({ loading: false, message: "'You're Logged out!" });
    refresh(false);
  };

if (loading) {
  return <div>{message}</div>
}

  return (
    <div className="Login">
      {user ? (
        <>
          <p>You're logged in as: {user}</p>
          <button onClick={() => handleLogout()} className="button ">
            Logout
          </button>
        </>
      ) : (
        <div className="loginFormWrapper">
          <span className="loginInstructions">
            <strong>Important!</strong>
            <p>
              In order for you to be able to log in and install your games, we first need you to follow the steps below:
            </p>
            <ol>
              <li>Open <span className="epicLink" onClick={() => createNewWindow(loginUrl)}>Epic Store here</span>, log in your account and copy your <span className="sid">SID information number</span>.</li>
              <li>Paste the <span className="sid">SID number</span> in the input box below, click on the login button and wait.</li>
            </ol>
          </span>
          <div className="loginForm">
            <input
              className="loginInput"
              id="sidInput"
              onChange={(event) => setInput(event.target.value)}
              placeholder={input}
            />
            <button
              onClick={() => handleLogin(input)}
              className="loginButton"
            >
              Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
