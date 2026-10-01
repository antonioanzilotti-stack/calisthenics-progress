import {lazy, Suspense, useState} from 'react';
import Nav from './components/Nav';
import Today from './pages/Today';
import Exercises from './pages/Exercises';
import Settings from './pages/Settings';

const Progress = lazy(() => import('./pages/Progress'));
const Body = lazy(() => import('./pages/Body'));

export default function App() {
  const [page, setPage] = useState('today');
  const Page = {today: Today, progress: Progress, body: Body, exercises: Exercises, settings: Settings}[page] || Today;
  return <><main><Suspense fallback={<p className="empty card">Caricamento…</p>}><Page/></Suspense></main><Nav page={page} setPage={setPage}/></>;
}
