import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function FadeInOut({ children, duration = 2.0 }: { children: ReactNode; duration: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration }}>
      {children}
    </motion.div>
  );
}
