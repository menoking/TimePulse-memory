import Header from './Header';
import UpdateToast from '../UI/UpdateToast';
import { ThemeColorSynchronizer } from '../../context/ThemeContext';

export default function Layout({ children }) {
  return (
    <ThemeColorSynchronizer>
      <div className="flex flex-col min-h-[100dvh]">
        <Header />
        {children}
        <UpdateToast />
      </div>
    </ThemeColorSynchronizer>
  );
}
