export default function Button({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '', type = 'button' }) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-green-600 hover:bg-green-500 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    ghost: 'bg-transparent hover:bg-gray-700 text-gray-300',
    outline: 'border border-gray-600 hover:border-gray-400 text-gray-200 hover:text-white',
    yellow: 'bg-yellow-500 hover:bg-yellow-400 text-black',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3.5 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
