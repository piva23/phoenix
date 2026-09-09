import { useLocation } from 'react-router-dom';

// StudyLayout is now a passthrough — StudyPage handles the header + tab bar.
// Individual pages still import this for backward compatibility.
export function StudyLayout({ children }) {
  return <>{children}</>;
}
