import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
      <div className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400">
        <p>
          &copy; {currentYear} {t('common.appName')}. All rights reserved. | Baptist Membership & Preparation
          Management System
        </p>
      </div>
    </footer>
  );
}
