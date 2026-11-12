import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import SessionRunner from '../features/practice/SessionRunner.jsx';
import { findSession, wrongItems } from '../lib/history.js';

/** Coba lagi soal yang salah dari satu sesi riwayat (#/riwayat/ulang/:id). */
export default function RetryPage() {
  const { id } = useParams();
  const [source] = useState(() => findSession(id));
  const [run, setRun] = useState(0);
  if (!source) return <Navigate to="/riwayat" replace />;
  const questions = wrongItems(source).map((i) => i.q);
  if (!questions.length) return <Navigate to="/riwayat" replace />;
  return (
    <SessionRunner
      key={run}
      questions={questions}
      title={`Coba lagi · ${source.title}`}
      kind="ulang"
      moduleId={source.moduleId}
      backTo="/riwayat"
      backLabel="Kembali ke Riwayat Latihan"
      onRestart={() => setRun((r) => r + 1)}
    />
  );
}
