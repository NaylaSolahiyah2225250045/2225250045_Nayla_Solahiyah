import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import SessionRunner from '../features/practice/SessionRunner.jsx';
import { BANK, PASS_COUNT, PER_SESSION } from '../content/bank.js';
import { progress } from '../lib/progress.js';
import { shuffle } from '../lib/shuffle.js';
import { PATH, useLearner } from '../lib/learner.js';

/** Mengerjakan satu titik Level pada jalur Latihan (#/latihan/:nodeId). */
export default function SessionPage() {
  const { nodeId } = useParams();
  const { statuses } = useLearner();
  const node = PATH.find((n) => n.id === nodeId);
  const [run, setRun] = useState(0);
  const [questions, setQuestions] = useState(() => (node?.kind === 'level' ? shuffle(BANK[node.moduleId].levels[node.level]).slice(0, PER_SESSION) : []));

  if (!node || statuses[node.id] === 'locked') return <Navigate to="/latihan" replace />;
  if (node.kind === 'kuis') return <Navigate to={`/modul/${node.moduleId}/kuis?dari=latihan`} replace />;

  const idx = PATH.indexOf(node);
  const nextNode = PATH[idx + 1];
  const next = nextNode
    ? { to: nextNode.kind === 'kuis' ? `/modul/${nextNode.moduleId}/kuis?dari=latihan` : `/latihan/${nextNode.id}`, label: `Lanjut: ${nextNode.kind === 'kuis' ? `Kuis Modul ${nextNode.moduleNo}` : `${nextNode.title} · ${nextNode.subtitle}`}` }
    : null;

  return (
    <SessionRunner
      key={`${nodeId}-${run}`}
      questions={questions}
      title={`Modul ${node.moduleNo} · ${node.title}`}
      kind="latihan"
      nodeId={node.id}
      moduleId={node.moduleId}
      passCount={PASS_COUNT}
      backTo="/latihan"
      next={next}
      onPassed={() => progress.unlockLevel(node.moduleId, node.level + 1)}
      onRestart={() => {
        setQuestions(shuffle(BANK[node.moduleId].levels[node.level]).slice(0, PER_SESSION));
        setRun((r) => r + 1);
      }}
    />
  );
}
