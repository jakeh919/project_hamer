import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { loadCourses, saveCourse, loadApiKey, saveApiKey } from '../../utils/storage';

const API_BASE = 'https://api.golfcourseapi.com/v1';

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function defaultHoles() {
  return Array.from({ length: 18 }, (_, i) => ({
    number: i + 1,
    par: 4,
    yardage: 380,
    rating: i + 1,
  }));
}

function mapApiHoles(apiHoles) {
  return apiHoles.map(h => ({
    number: h.number,
    par: h.par ?? 4,
    yardage: h.yardage ?? 0,
    rating: h.handicap ?? h.number,
  }));
}

// ── Saved tab ────────────────────────────────────────────────────────────────
function SavedTab({ courses, pickedId, onPick, onNew }) {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col gap-3 items-center py-8">
        <p className="text-gray-500 text-sm">No saved courses yet.</p>
        <Button onClick={onNew} variant="outline" size="sm">+ Create manually</Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {courses.map(c => (
        <button
          key={c.id}
          onClick={() => onPick(c.id)}
          className={`p-4 rounded-xl text-left transition-colors ${pickedId === c.id ? 'bg-green-700 border border-green-500 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}
        >
          <div className="font-semibold">{c.name}</div>
          <div className="text-sm opacity-60">18 holes · saved</div>
        </button>
      ))}
    </div>
  );
}

// ── Search tab ───────────────────────────────────────────────────────────────
function SearchTab({ onCourseReady }) {
  const [apiKey, setApiKeyLocal] = useState(() => loadApiKey());
  const [editingKey, setEditingKey] = useState(!loadApiKey());
  const [tempKey, setTempKey] = useState(loadApiKey());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);

  function saveKey() {
    saveApiKey(tempKey);
    setApiKeyLocal(tempKey);
    setEditingKey(false);
  }

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const res = await fetch(`${API_BASE}/search?search_query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Key ${apiKey}` },
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Invalid API key. Check your key and try again.');
        throw new Error(`Search failed (${res.status})`);
      }
      const data = await res.json();
      setResults(data.courses ?? []);
      if ((data.courses ?? []).length === 0) setError('No courses found. Try a different search.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function selectCourse(courseResult) {
    setLoadingDetail(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/courses/${courseResult.id}`, {
        headers: { Authorization: `Key ${apiKey}` },
      });
      if (!res.ok) throw new Error(`Failed to load course (${res.status})`);
      const data = await res.json();
      const apiCourse = data.course;
      const holes = mapApiHoles(apiCourse.holes ?? []);
      const course = {
        id: generateId(),
        name: [apiCourse.club_name, apiCourse.course_name].filter(Boolean).join(' — '),
        holes: holes.length === 18 ? holes : defaultHoles(),
      };
      onCourseReady(course);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* API key row */}
      {editingKey ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300 font-medium">
            Golf Course API Key
            <a
              href="https://golfcourseapi.com"
              target="_blank"
              rel="noreferrer"
              className="ml-2 text-green-400 text-xs underline"
            >
              Get free key ↗
            </a>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tempKey}
              onChange={e => setTempKey(e.target.value)}
              placeholder="Paste your API key"
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
            />
            <button
              onClick={saveKey}
              disabled={!tempKey.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-semibold rounded-lg text-sm"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">API key set</span>
          <button onClick={() => setEditingKey(true)} className="text-gray-400 hover:text-white underline text-xs">
            Change
          </button>
        </div>
      )}

      {/* Search bar */}
      {!editingKey && (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Course name or city..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
            <button
              onClick={search}
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-semibold rounded-lg text-sm"
            >
              {loading ? '…' : 'Search'}
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {loadingDetail && (
            <p className="text-gray-400 text-sm text-center py-4">Loading course data…</p>
          )}

          {results.length > 0 && !loadingDetail && (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => selectCourse(r)}
                  className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-left"
                >
                  <div className="text-white font-medium text-sm">
                    {[r.club_name, r.course_name].filter(Boolean).join(' — ')}
                  </div>
                  {r.location && (
                    <div className="text-gray-500 text-xs mt-0.5">
                      {[r.location.city, r.location.state].filter(Boolean).join(', ')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Manual entry tab ─────────────────────────────────────────────────────────
function ManualTab({ onSave }) {
  const [name, setName] = useState('');
  const [holes, setHoles] = useState(defaultHoles());

  function updateHole(i, field, val) {
    setHoles(h => h.map((hole, idx) => idx === i ? { ...hole, [field]: parseInt(val) || 0 } : hole));
  }

  function handleSave() {
    const course = { id: generateId(), name: name.trim(), holes };
    saveCourse(course);
    onSave(course);
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Course Name"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g. Pebble Beach"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400">
              <th className="text-left py-1 pr-2">Hole</th>
              <th className="text-center py-1 px-1">Par</th>
              <th className="text-center py-1 px-1">Yds</th>
              <th className="text-center py-1 px-1">Hdcp</th>
            </tr>
          </thead>
          <tbody>
            {holes.map((h, i) => (
              <tr key={i} className="border-t border-gray-700">
                <td className="py-1.5 pr-2 text-gray-400 font-medium">{h.number}</td>
                <td className="py-1.5 px-1">
                  <input type="number" value={h.par} onChange={e => updateHole(i, 'par', e.target.value)}
                    className="w-14 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-center" min={3} max={5} />
                </td>
                <td className="py-1.5 px-1">
                  <input type="number" value={h.yardage} onChange={e => updateHole(i, 'yardage', e.target.value)}
                    className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-center" min={50} />
                </td>
                <td className="py-1.5 px-1">
                  <input type="number" value={h.rating} onChange={e => updateHole(i, 'rating', e.target.value)}
                    className="w-14 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-center" min={1} max={18} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={handleSave} disabled={!name.trim()} className="w-full">
        Save Course
      </Button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function CourseStep({ selectedCourse, onNext, onBack }) {
  const [courses, setCourses] = useState(() => loadCourses());
  const [tab, setTab] = useState('saved');
  const [pickedId, setPickedId] = useState(selectedCourse?.id ?? '');
  // Course fetched from API, pending confirmation
  const [pendingCourse, setPendingCourse] = useState(null);

  const pickedCourse = courses.find(c => c.id === pickedId);

  function handleApiCourse(course) {
    setPendingCourse(course);
  }

  function confirmApiCourse() {
    saveCourse(pendingCourse);
    setCourses(loadCourses());
    setPickedId(pendingCourse.id);
    setPendingCourse(null);
    setTab('saved');
  }

  function handleManualSave(course) {
    setCourses(loadCourses());
    setPickedId(course.id);
    setTab('saved');
  }

  const tabs = [
    { id: 'saved', label: 'Saved' },
    { id: 'search', label: 'Search' },
    { id: 'manual', label: 'Manual' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Course</h2>
        <p className="text-gray-400 text-sm mt-1">Search the course database or enter manually</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 p-1 rounded-xl">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setPendingCourse(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t.id ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Pending API course confirmation */}
      {pendingCourse ? (
        <div className="flex flex-col gap-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-white font-semibold mb-1">{pendingCourse.name}</p>
            <p className="text-gray-400 text-sm mb-3">{pendingCourse.holes.length} holes loaded from API</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left pb-1">Hole</th>
                    <th className="text-center pb-1">Par</th>
                    <th className="text-center pb-1">Yds</th>
                    <th className="text-center pb-1">Hdcp</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCourse.holes.map(h => (
                    <tr key={h.number} className="border-t border-gray-700">
                      <td className="py-1 text-gray-400">{h.number}</td>
                      <td className="py-1 text-center text-white">{h.par}</td>
                      <td className="py-1 text-center text-gray-300">{h.yardage}</td>
                      <td className="py-1 text-center text-gray-300">{h.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setPendingCourse(null)} variant="ghost" className="flex-1">
              Cancel
            </Button>
            <Button onClick={confirmApiCourse} className="flex-1">
              Save & Use This Course
            </Button>
          </div>
        </div>
      ) : (
        <>
          {tab === 'saved' && (
            <SavedTab
              courses={courses}
              pickedId={pickedId}
              onPick={setPickedId}
              onNew={() => setTab('manual')}
            />
          )}
          {tab === 'search' && <SearchTab onCourseReady={handleApiCourse} />}
          {tab === 'manual' && <ManualTab onSave={handleManualSave} />}
        </>
      )}

      {!pendingCourse && (
        <div className="flex gap-3">
          <Button onClick={onBack} variant="ghost" size="lg" className="flex-1">
            Back
          </Button>
          <Button
            onClick={() => pickedCourse && onNext(pickedCourse)}
            disabled={!pickedCourse}
            size="lg"
            className="flex-1"
          >
            {pickedCourse ? `Next: Bet` : 'Select a course'}
          </Button>
        </div>
      )}
    </div>
  );
}
