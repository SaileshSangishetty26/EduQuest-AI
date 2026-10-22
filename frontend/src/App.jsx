import React, {useEffect, useState, useCallback} from 'react';
import {api} from './services/api';
import {computeXP, levelFromXP, touchStreak} from './utils/gamify';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Lessons from './pages/Lessons';
import LessonView from './pages/LessonView';
import Quiz from './pages/Quiz';
import Chat from './pages/Chat';
import ProfileSettings from './components/ProfileSettings';

export default function App(){
  const [user,setUser] = useState(()=>{
    const stored = JSON.parse(localStorage.getItem('eduquest_user')||'null');
    // EduQuest covers Grade 6 only. A browser still signed in from when
    // Grade 7 existed would otherwise ask for Grade 7 chapters and see none.
    return stored && stored.grade !== 6 ? { ...stored, grade: 6 } : stored;
  });
  const [page,setPage] = useState(user?'dashboard':'login');
  const [selectedLesson,setSelectedLesson] = useState(null);
  const [selectedQuiz,setSelectedQuiz] = useState(null);
  const [progress,setProgress] = useState(null);
  const [streak,setStreak] = useState(0);
  const [showSettings,setShowSettings] = useState(false);

  useEffect(()=>{ if(user) localStorage.setItem('eduquest_user',JSON.stringify(user)); },[user]);

  const refreshProgress = useCallback(()=>{
    if(!user) return;
    api.progress(user.id).then(setProgress).catch(()=>{});
  },[user]);

  useEffect(()=>{
    if(!user) return;
    refreshProgress();
    setStreak(touchStreak(user.id));
  },[user, refreshProgress]);

  function logout(){ localStorage.removeItem('eduquest_user'); setUser(null); setPage('login'); setProgress(null); }

  if(!user){
    if(page==='register') return <Register onLogin={()=>setPage('login')} onRegistered={(u)=>{setUser(u);setPage('dashboard')}} />;
    return <Login onRegister={()=>setPage('register')} onLoggedIn={(u)=>{setUser(u);setPage('dashboard')}} />;
  }

  const xp = computeXP(progress);
  const level = levelFromXP(xp);

  const nav = (p)=>setPage(p);
  const shared = {
    user, level, streak,
    onLogout: logout,
    onChat: () => nav('chat'),
    onSettings: () => setShowSettings(true)
  };

  const openLessonById = (ref) => {
    api.lesson(ref.id).then(l => { setSelectedLesson(l); setPage('lesson'); }).catch(()=>{});
  };

  // The settings panel overlays whichever page is open, so it is rendered
  // alongside the page rather than replacing it.
  const settingsPanel = showSettings ? (
    <ProfileSettings
      user={user}
      onUpdated={setUser}
      onClose={()=>setShowSettings(false)}
    />
  ) : null;

  const withSettings = (pageElement) => (
    <>
      {pageElement}
      {settingsPanel}
    </>
  );

  if(page==='chat') return withSettings( <Chat {...shared} onBack={()=>nav('dashboard')} onLessons={()=>nav('lessons')} onOpenLesson={openLessonById}/>);
  if(page==='lessons') return withSettings(<Lessons {...shared} onBack={()=>nav('dashboard')} onOpenLesson={(l)=>{setSelectedLesson(l);setPage('lesson')}} onOpenQuiz={(q)=>{setSelectedQuiz(q);setPage('quiz')}}/>);
  if(page==='lesson') return withSettings(<LessonView {...shared} lesson={selectedLesson} onBack={()=>nav('lessons')} onQuiz={(q)=>{setSelectedQuiz(q);setPage('quiz')}}/>);
  if(page==='quiz') return withSettings(<Quiz {...shared} quiz={selectedQuiz} onBack={()=>{nav('lessons'); refreshProgress();}} onSubmitted={refreshProgress}/>);
  return withSettings(<Dashboard {...shared} progress={progress} onLessons={()=>nav('lessons')} onOpenLesson={openLessonById}/>);
}
