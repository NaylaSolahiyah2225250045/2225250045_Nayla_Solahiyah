/** Skala beban kognitif Paas (1–9). */
export default function PaasScale({ value, onChange }) {
  return (
    <div className="stack-s">
      <p className="lead" id="paas-q">
        Seberapa berat usaha pikiranmu untuk memahami materi tadi?
      </p>
      <div className="paas" role="group" aria-labelledby="paas-q">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" aria-pressed={value === n} onClick={() => onChange(n)} aria-label={`${n} dari 9`}>
            {n}
          </button>
        ))}
      </div>
      <div className="paas-labels" aria-hidden="true">
        <span>Sangat ringan</span>
        <span>Sangat berat</span>
      </div>
    </div>
  );
}
