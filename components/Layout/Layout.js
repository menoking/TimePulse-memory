import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import UpdateToast from '../UI/UpdateToast';
import { ThemeColorSynchronizer } from '../../context/ThemeContext';
import { useFullscreen } from '../../context/FullscreenContext';
import { useTranslation } from '../../hooks/useTranslation';

export default function Layout({ children }) {
  const { t } = useTranslation();
  const { isFullscreen } = useFullscreen();
  const { scrollYProgress } = useScroll();
  const footerRef = useRef(null);
  const [showFooter, setShowFooter] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  
  // 页面滚动时，Footer的透明度和z-index - 更早开始显示
  const footerOpacity = useTransform(
    scrollYProgress, 
    [0, 0.4, 0.6, 0.8], 
    [0, 0, 0.5, 1]
  );
  
  const footerBlur = useTransform(
    scrollYProgress, 
    [0.4, 0.8], 
    [0, 16]
  );
  
  // Footer的z-index随滚动逐渐增加，但保持在Header之下 - 更早开始增加
  const footerZIndex = useTransform(
    scrollYProgress,
    [0, 0.2, 0.5, 0.8],
    [1, 5, 15, 35]
  );
  
  // 监听滚动到底部事件
  useEffect(() => {
    const handleScroll = () => {
      // 设置已经滚动标志
      if (window.scrollY > 10 && !hasScrolled) {
        setHasScrolled(true);
      }
      
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // 调整触发距离，让footer更早开始显示
      const isNearBottom = scrollPosition + windowHeight >= documentHeight - 300;
      // 检查是否在顶部
      const isAtTop = scrollPosition <= 50;
      
      if (isNearBottom && !showFooter) {
        setShowFooter(true);
        if (window.location.hash !== '#footer') {
          window.location.hash = 'footer';
        }
      } else if (!isNearBottom && showFooter) {
        setShowFooter(false);
        if (window.location.hash === '#footer') {
          window.location.hash = '';
        }
      } else if (isAtTop && window.location.hash === '#footer') {
        // 当滚动到顶部时，如果当前hash是#footer，则清除它
        window.location.hash = '';
      }
    };
    
    // 初始状态下不显示footer
    setShowFooter(false);
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showFooter, hasScrolled]);

  return (
    <ThemeColorSynchronizer>
      <div className="flex flex-col min-h-screen">
        <Header />

        {children}

        {/* 添加更新提示 Toast */}
        <UpdateToast />

        {/* 修改 Footer 容器，适应不同屏幕大小，全屏时隐藏 */}
        {!isFullscreen && (
          <motion.div
            ref={footerRef}
            style={{
              opacity: footerOpacity,
              backdropFilter: `blur(${footerBlur.get()}px)`,
              zIndex: footerZIndex,
              pointerEvents: showFooter ? 'auto' : 'none'
            }}
            className="fixed inset-0 flex items-center justify-center overflow-y-auto"
          >
            <div className="w-full">
              <Footer />
            </div>
          </motion.div>
        )}
        
        {/* 下滑提示 - 当footer显示时或已经滚动时或全屏时隐藏 */}
        {!showFooter && !hasScrolled && !isFullscreen && (
          <motion.div 
            className="fixed bottom-24 left-0 right-0 mx-auto w-full text-center text-gray-400 text-sm pointer-events-none z-20"
            initial={{ opacity: 0.6 }}
            animate={{ 
              opacity: [0.6, 1, 0.6],
              y: [0, 10, 0]
            }}
            transition={{ 
              repeat: Infinity,
              duration: 2
            }}
          >
            <p>{t('footer.scrollDown', '向下滑动查看更多信息')}</p>
            <svg className="w-6 h-6 mx-auto mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        )}
        
        {/* 添加滚动空间 */}
        <div className="h-screen"></div>
      </div>
    </ThemeColorSynchronizer>
  );
}
