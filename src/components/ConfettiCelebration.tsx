
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

interface ConfettiCelebrationProps {
  show: boolean;
  onComplete?: () => void;
}

const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({ show, onComplete }) => {
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  useEffect(() => {
    if (show) {
      // Generate confetti pieces
      const pieces: ConfettiPiece[] = [];
      for (let i = 0; i < 50; i++) {
        pieces.push({
          id: i,
          x: Math.random() * 100, // Percentage
          y: -10, // Start above screen
          rotation: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4, // 4-12px
          delay: Math.random() * 1000 // 0-1000ms delay
        });
      }
      setConfettiPieces(pieces);

      // Auto-complete after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute rounded-sm"
          style={{
            left: `${piece.x}%`,
            backgroundColor: piece.color,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
          }}
          initial={{
            y: piece.y,
            rotate: piece.rotation,
            opacity: 1,
          }}
          animate={{
            y: window.innerHeight + 50,
            rotate: piece.rotation + 720, // Two full rotations
            opacity: 0,
          }}
          transition={{
            duration: 3,
            delay: piece.delay / 1000,
            ease: "easeOut",
          }}
        />
      ))}
      
      {/* Central celebration text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            duration: 0.5,
            type: "spring",
            stiffness: 200,
            damping: 10
          }}
          className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg border"
        >
          <div className="text-center">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl mb-2"
            >
              🎉
            </motion.div>
            <h3 className="text-xl font-bold text-green-600 mb-1">
              Exercise Mastered!
            </h3>
            <p className="text-sm text-gray-600">
              3/3 completions achieved
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ConfettiCelebration;
