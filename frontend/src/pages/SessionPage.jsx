import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import SessionRunner from '../features/practice/SessionRunner.jsx';
import { BANK, PASS_COUNT, PER_SESSION } from '../content/bank.js';
import { progress } from '../lib/progress.js';
import { PATH, toTopicNodeId, useLearner } from '../lib/learner.js';
import { nodeLabel, nodeRoute, toPracticeNodeId } from '../lib/path.js';
import { goalFor } from '../lib/rmt.js';

/** Soal latihan topik: 10 soal BERURUTAN dari mudah ke sulit (tidak diacak, 23 Nov 2026). */
const draw = (node) => BANK[node.moduleId].levels[node.level].slice(0, PER_SESSION);

/**
 * Mengerjakan latihan satu topik pada jalur Latihan (#/latihan/:nodeId).
 * `key={nodeId}`: tombol "Lanjut: Topik berikutnya" tetap di rute yang sama, jadi tanpa key React memakai
 * ulang komponen dan soal topik sebelumnya ikut terbawa (perbaikan 23 Nov 2026).
 */
export default function SessionPage() {
  const { nodeId: rawId } = useParams();
  // tautan lama: "m2-l1" → "t2-l1" → "t2-latihan" (Level 1–4 lama digabung menjadi satu latihan)
  const nodeId = toPracticeNodeId(toTopicNodeId(rawId));
  return <TopicSession key={nodeId} nodeId={nodeId} />;
}

function TopicSession({ nodeId }) {
  const { statuses } = useLearner();
  const node = PATH.find((n) => n.id === nodeId);
  const [run, setRun] = useState(0);
  const [questions, setQuestions] = useState(() => (node?.kind === 'level' ? draw(node) : []));

  if (!node || statuses[node.id] === 'locked') return <Navigate to="/latihan" replace />;
  if (node.kind === 'final') return <Navigate to="/kuis-akhir" replace />;

  const nextNode = PATH[PATH.indexOf(node) + 1];
  const next = nextNode ? { to: nodeRoute(nextNode), label: `Lanjut: ${nodeLabel(nextNode)}` } : null;

  return (
    <SessionRunner
      key={`${nodeId}-${run}`}
      questions={questions}
      title={`Topik ${node.moduleNo} · ${node.title} ${node.subtitle}`}
      kind="latihan"
      nodeId={node.id}
      moduleId={node.moduleId}
      passCount={PASS_COUNT}
      goal={goalFor({ kind: 'level', topicId: node.moduleId, level: node.level })}
      backTo="/latihan"
      next={next}
      onPassed={() => progress.markPracticeDone(node.moduleId)}
      onRestart={() => {
        setQuestions(draw(node));
        setRun((r) => r + 1);
      }}
    />
  );
}
