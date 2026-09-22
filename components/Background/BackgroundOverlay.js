import { motion } from 'framer-motion';
import { useBackground } from '../../context/BackgroundContext';

export default function BackgroundOverlay() {
  const { customBackgroundId, imageEnabled, bgOpacity } = useBackground();
  const isVisible = Boolean(customBackgroundId && imageEnabled);

  return (
    <motion.div
      className="fixed inset-0 z-[2] bg-black pointer-events-none"
      aria-hidden="true"
      initial={false}
      animate={{ opacity: isVisible ? bgOpacity : 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    />
  );
}
