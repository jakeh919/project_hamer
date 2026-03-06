const GAME_KEY = 'hammer_game_state';
const COURSES_KEY = 'hammer_courses';

export function loadGameState() {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGameState(state) {
  try {
    localStorage.setItem(GAME_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state', e);
  }
}

export function clearGameState() {
  localStorage.removeItem(GAME_KEY);
}

export function loadCourses() {
  try {
    const raw = localStorage.getItem(COURSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCourse(course) {
  const courses = loadCourses();
  const existing = courses.findIndex(c => c.id === course.id);
  if (existing >= 0) {
    courses[existing] = course;
  } else {
    courses.push(course);
  }
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

export function deleteCourse(courseId) {
  const courses = loadCourses().filter(c => c.id !== courseId);
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

const API_KEY_KEY = 'hammer_golf_api_key';

export function loadApiKey() {
  return localStorage.getItem(API_KEY_KEY) ?? '';
}

export function saveApiKey(key) {
  localStorage.setItem(API_KEY_KEY, key.trim());
}
