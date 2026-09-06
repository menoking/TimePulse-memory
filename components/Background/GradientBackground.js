import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimers } from '../../context/TimerContext';
import { useTheme } from '../../context/ThemeContext';
import { useBackground } from '../../context/BackgroundContext';

export default function GradientBackground() {
  const { getActiveTimer, activeTimerId } = useTimers();
  const { theme } = useTheme();
  const { backgroundType } = useBackground();

  // 如果使用自定义背景，不渲染渐变背景
  if (backgroundType === 'custom') {
    return null;
  }
  const [circles, setCircles] = useState([]);
  const [prevTimerId, setPrevTimerId] = useState(null);
  const containerRef = useRef(null);
  const activeTimer = getActiveTimer();
  const [isSafari, setIsSafari] = useState(false);
  
  // 检测Safari浏览器
  useEffect(() => {
    // 检测Safari浏览器
    const isSafariBrowser = 
      navigator.userAgent.indexOf('Safari') !== -1 && 
      navigator.userAgent.indexOf('Chrome') === -1;
    
    // 检测iOS设备
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    setIsSafari(isSafariBrowser || isIOS);
  }, []);
  
  // 生成渐变圆圈 - 针对Safari减少圆圈数量和动画复杂度
  useEffect(() => {
    // 检查计时器是否变化
    const isNewTimer = activeTimerId !== prevTimerId;
    if (isNewTimer) {
      setPrevTimerId(activeTimerId);
    }
    
    // 基于活动计时器的颜色生成颜色
    const baseColor = activeTimer?.color || '#0ea5e9';
    const colors = generateColors(baseColor, theme === 'dark');
    
    // 针对Safari减少圆圈数量
    const circleCount = 5
    
    // 生成或更新圆圈配置
    if (circles.length === 0 || isNewTimer) {
      // 如果是新计时器或初始化，创建新圆圈
      const newCircles = Array.from({ length: circleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 30 + Math.random() * 40,
        y: Math.random() * 100 - 30 + Math.random() * 40,
        size: 30 + Math.random() * 40,
        speedX: (Math.random() - 0.5) * (isSafari ? 0.01 : 0.03), // 降低Safari中的速度
        speedY: (Math.random() - 0.5) * (isSafari ? 0.01 : 0.03), // 降低Safari中的速度
        color: colors[i % colors.length],
        blur: isSafari ? 40 : (60 + Math.random() * 40), // 减少Safari中的模糊强度
        opacity: 0.3 + Math.random() * (isSafari ? 0.2 : 0.3) // 降低Safari中的透明度变化
      }));
      setCircles(newCircles);
    } else if (activeTimer) {
      // 如果计时器颜色变化，平滑过渡圆圈颜色
      setCircles(prev => prev.map((circle, i) => ({
        ...circle,
        // 使用过渡这里，而不是闪烁效果
        color: colors[i % colors.length]
      })));
    }
  }, [activeTimerId, theme, activeTimer, isSafari]);
  
  // 根据基础颜色生成一组和谐的颜色
  const generateColors = (baseColor, isDark) => {
    // 解析颜色
    let r, g, b;
    
    if (baseColor.startsWith('#')) {
      const hex = baseColor.slice(1);
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      // 默认颜色
      r = 14;
      g = 165;
      b = 233;
    }
    
    // 生成颜色变体
    return [
      `rgba(${r}, ${g}, ${b}, 0.5)`, // 原色
      `rgba(${r * 0.8}, ${g * 1.1}, ${b * 1.2}, 0.5)`, // 变体1
      `rgba(${r * 1.2}, ${g * 0.8}, ${b * 0.9}, 0.5)`, // 变体2
      `rgba(${r * 0.9}, ${g * 0.9}, ${b * 1.3}, 0.5)`, // 变体3
      `rgba(${r * 1.1}, ${g * 1.2}, ${b * 0.8}, 0.5)`, // 变体4
      `rgba(${r * 1.3}, ${g * 0.9}, ${b * 0.9}, 0.5)`  // 变体5
    ];
  };
  
  return (
    <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
      <AnimatePresence>
        {circles.map(circle => (
          <motion.div
            key={`circle-${circle.id}-${activeTimerId || 'default'}`}
            className="moving-circle absolute"
            initial={{ 
              left: `${circle.x}vw`,
              top: `${circle.y}vh`,
              width: `${circle.size}vw`,
              height: `${circle.size}vw`,
              opacity: 0 
            }}
            animate={{
              left: [`${circle.x}vw`, `${circle.x + circle.speedX * 100}vw`],
              top: [`${circle.y}vh`, `${circle.y + circle.speedY * 100}vh`],
              backgroundColor: circle.color,
              filter: `blur(${circle.blur}px)`,
              opacity: circle.opacity
            }}
            transition={{
              left: { duration: isSafari ? 30 : 20, ease: "linear", repeat: Infinity, repeatType: "reverse" },
              top: { duration: isSafari ? 30 : 20, ease: "linear", repeat: Infinity, repeatType: "reverse" },
              // 增加Safari中的过渡持续时间，减少更新频率
              backgroundColor: { duration: isSafari ? 3.5 : 2.5, ease: "easeOut" },
              opacity: { duration: isSafari ? 1.2 : 0.8 }
            }}
            style={{
              // 添加硬件加速属性
              WebkitTransform: "translateZ(0)",
              transform: "translateZ(0)",
              willChange: "transform"
            }}
          />
        ))}
      </AnimatePresence>
      
      {/* 移除闪烁动画，替换为以下更平滑的过渡效果 */}
      {activeTimerId !== prevTimerId && prevTimerId !== null && (
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          // 背景使用径向渐变，从中心向外扩散，效果更自然
          style={{ 
            background: `radial-gradient(circle at center, ${activeTimer?.color || '#0ea5e9'}05 0%, transparent 70%)` 
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          onAnimationComplete={() => setPrevTimerId(activeTimerId)}
        />
      )}
    </div>
  );
}
