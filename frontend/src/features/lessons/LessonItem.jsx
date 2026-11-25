import { useState } from 'react';
import { Link } from 'react-router-dom';
import { backSteps, operationSteps, workedSteps, zeroSteps } from '../../lib/sci/index.js';
import { Sci } from '../../components/Sci.jsx';
import BackVisualizer from '../../components/BackVisualizer.jsx';
import CommaVisualizer from '../../components/CommaVisualizer.jsx';
import QuestionCard from '../practice/QuestionCard.jsx';
import GuidedSolver from '../guided/GuidedSolver.jsx';
import Visual from './Visual.jsx';

/** Langkah contoh: tulisan manual (Modul 1), atau dihitung lib/sci sesuai jenis soal. */
const stepsOf = (item) => {
  if (item.steps) return item.steps;
  if (item.qtype === 'to_standard') return backSteps(item.a, item.n);
  if (item.qtype === 'operation') return operationSteps(item);
  if (item.focus === 'zero') return zeroSteps(item.value);
  return workedSteps(item.value);
};

const PROMPT = {
  power_of_ten: 'Tulis sebagai 10 pangkat berapa:',
  to_standard: 'Tulis dalam bentuk biasa:',
  operation: 'Hitung, lalu tulis hasilnya dalam bentuk baku:',
};

/** Soal yang ditampilkan di kartu contoh. */
function ExampleValue({ item }) {
  if (item.qtype === 'to_standard') return <Sci a={item.a} n={item.n} />;
  if (item.qtype === 'operation') {
    return (
      <>
        (<Sci a={item.x.a} n={item.x.n} />) {item.op === 'kali' ? '×' : ':'} (<Sci a={item.y.a} n={item.y.n} />)
      </>
    );
  }
  return item.value;
}

/** Kartu soal di contoh terurai / setengah jadi. */
function ExampleHead({ item }) {
  return (
    <div className="card stack-s">
      <p className={item.text ? 'lead' : 'muted'}>{item.text ?? PROMPT[item.qtype] ?? 'Tulis dalam bentuk baku:'}</p>
      <p className={`big-number${item.qtype === 'operation' ? ' big-number--expr' : ''}`}>
        <ExampleValue item={item} />
      </p>
    </div>
  );
}

function Intro({ item, module }) {
  return (
    <div className="stack">
      <h2 className="concept-title">{item.title}</h2>
      <p className="lead">{item.text}</p>
      <div className="callout">
        <strong>Tujuan:</strong> {module.objective}
      </div>
    </div>
  );
}

function Concept({ item }) {
  return (
    <div className="stack">
      <h2 className="concept-title">{item.title}</h2>
      {item.text && <p className="lead">{item.text}</p>}
      {item.list && (
        <ol className="steps">
          {item.list.map((s) => (
            <li key={s}>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      )}
      <Visual visual={item.visual} />
      {item.callout && <div className="callout">{item.callout}</div>}
    </div>
  );
}

function Worked({ item }) {
  const steps = stepsOf(item);
  const [shown, setShown] = useState(1);
  return (
    <div className="stack">
      <ExampleHead item={item} />
      <ol className="steps" aria-live="polite">
        {steps.slice(0, shown).map((s, i) => (
          <li key={s} className={i === shown - 1 ? 'is-active' : ''}>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      {shown < steps.length ? (
        <button type="button" className="btn btn--block" onClick={() => setShown((n) => n + 1)}>
          Langkah berikutnya ({shown}/{steps.length})
        </button>
      ) : item.qtype === 'to_standard' ? (
        <BackVisualizer a={item.a} n={item.n} autoPlay />
      ) : item.qtype === 'operation' ? null : (
        <CommaVisualizer value={item.value} autoPlay />
      )}
    </div>
  );
}

function Faded({ item }) {
  const steps = stepsOf(item);
  const shown = item.shown ?? steps.length - 1;
  const q =
    item.qtype === 'to_standard'
      ? { type: item.qtype, a: item.a, n: item.n, focus: 'back' }
      : item.qtype === 'operation'
        ? { type: 'operation', op: item.op, x: item.x, y: item.y, text: item.text, unit: item.unit }
        : { type: item.qtype, value: item.value, focus: item.focus };
  return (
    <div className="stack">
      <ExampleHead item={item} />
      <ol className="steps">
        {steps.slice(0, shown).map((s) => (
          <li key={s}>
            <span>{s}</span>
          </li>
        ))}
        <li className="is-active">
          <span>Sekarang giliranmu: lanjutkan dan tulis jawabannya.</span>
        </li>
      </ol>
      <QuestionCard q={q} showPrompt={false} />
    </div>
  );
}

function Guided({ item }) {
  return (
    <div className="stack">
      <GuidedSolver value={item.value} />
    </div>
  );
}

function Practice({ module }) {
  return (
    <div className="stack">
      <h2 className="concept-title">Saatnya berlatih!</h2>
      <p className="lead">Ada 10 soal, berurutan dari mudah ke sulit. Jawab benar minimal 6 soal untuk menuntaskan latihan topik ini.</p>
      <Link className="btn btn--primary btn--block" to={`/modul/${module.id}/latihan`}>
        Mulai latihan
      </Link>
      <p className="small muted">Kamu bisa kembali ke materi kapan saja.</p>
    </div>
  );
}

function Quiz({ module }) {
  return (
    <div className="stack">
      <h2 className="concept-title">Uji pemahamanmu</h2>
      <p className="lead">5 soal tanpa petunjuk. Hasil dan pembahasan muncul setelah semua soal dijawab.</p>
      <Link className="btn btn--primary btn--block" to={`/modul/${module.id}/kuis`}>
        Mulai kuis
      </Link>
    </div>
  );
}

const VIEWS = { intro: Intro, concept: Concept, worked: Worked, faded: Faded, guided: Guided, practice: Practice, quiz: Quiz };

export default function LessonItem({ item, module }) {
  const View = VIEWS[item.type];
  return View ? <View item={item} module={module} /> : null;
}
