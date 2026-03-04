import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { loadCourses, saveCourse } from '../../utils/storage';

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

export default function CourseStep({ selectedCourse, onNext, onBack }) {
  const [courses, setCourses] = useState(() => loadCourses());
  const [mode, setMode] = useState(selectedCourse ? 'pick' : 'pick');
  const [pickedId, setPickedId] = useState(selectedCourse?.id ?? '');
  const [newName, setNewName] = useState('');
  const [newHoles, setNewHoles] = useState(defaultHoles());

  function updateHole(index, field, value) {
    setNewHoles(holes => holes.map((h, i) =>
      i === index ? { ...h, [field]: parseInt(value) || 0 } : h
    ));
  }

  function saveNew() {
    const course = {
      id: generateId(),
      name: newName.trim(),
      holes: newHoles,
    };
    saveCourse(course);
    setCourses(loadCourses());
    setMode('pick');
    setPickedId(course.id);
  }

  function handleNext() {
    if (mode === 'new') {
      saveNew();
      return;
    }
    const course = courses.find(c => c.id === pickedId);
    if (course) onNext(course);
  }

  const pickedCourse = courses.find(c => c.id === pickedId);
  const canProceed = mode === 'new'
    ? newName.trim().length > 0
    : !!pickedCourse;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Course</h2>
        <p className="text-gray-400 text-sm mt-1">Select a saved course or enter a new one</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode('pick')}
          className={`flex-1 py-2.5 rounded-xl font-semibold transition-colors ${mode === 'pick' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Saved Courses
        </button>
        <button
          onClick={() => setMode('new')}
          className={`flex-1 py-2.5 rounded-xl font-semibold transition-colors ${mode === 'new' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          New Course
        </button>
      </div>

      {mode === 'pick' && (
        <div className="flex flex-col gap-2">
          {courses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No saved courses yet. Create a new one!</p>
          ) : (
            courses.map(c => (
              <button
                key={c.id}
                onClick={() => setPickedId(c.id)}
                className={`p-4 rounded-xl text-left transition-colors ${pickedId === c.id ? 'bg-green-700 text-white border border-green-500' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}
              >
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm opacity-70">18 holes</div>
              </button>
            ))
          )}
          {courses.length === 0 && (
            <Button onClick={() => setMode('new')} variant="outline">
              + Create New Course
            </Button>
          )}
        </div>
      )}

      {mode === 'new' && (
        <div className="flex flex-col gap-4">
          <Input
            label="Course Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
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
                {newHoles.map((h, i) => (
                  <tr key={i} className="border-t border-gray-700">
                    <td className="py-1.5 pr-2 text-gray-400 font-medium">{h.number}</td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number"
                        value={h.par}
                        onChange={e => updateHole(i, 'par', e.target.value)}
                        className="w-14 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-center"
                        min={3} max={5}
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number"
                        value={h.yardage}
                        onChange={e => updateHole(i, 'yardage', e.target.value)}
                        className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-center"
                        min={50}
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number"
                        value={h.rating}
                        onChange={e => updateHole(i, 'rating', e.target.value)}
                        className="w-14 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-center"
                        min={1} max={18}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="ghost" size="lg" className="flex-1">
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed} size="lg" className="flex-1">
          {mode === 'new' ? 'Save & Next' : 'Next: Bet'}
        </Button>
      </div>
    </div>
  );
}
