import React from 'react';
import { UniversalCalendarView } from '../components/UniversalCalendarView';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/layout/PageHeader';

export function CalendarPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="page-container"
    >
      {/* Header */}
      <PageHeader
        icon="📅"
        title="Calendário Universal"
        subtitle="Dia, semana, mês e ano — todos os seus compromissos, tarefas, vencimentos e revisões em um só lugar."
      />

      {/* Main Calendar View Component */}
      <UniversalCalendarView />
    </motion.div>
  );
}
export default CalendarPage;