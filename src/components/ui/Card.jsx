export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-gray-800 rounded-2xl p-4 ${className}`}>
      {children}
    </div>
  );
}
