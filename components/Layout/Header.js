import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiSettings, FiMoon, FiSun, FiUser, FiMaximize, FiMinimize, FiEdit, FiSave, FiGlobe, FiPlus, FiShare2, FiImage } from 'react-icons/fi';
import { useTimers } from '../../context/TimerContext';
import { useTheme } from '../../context/ThemeContext';
import { useFullscreen } from '../../context/FullscreenContext';
import { useTranslation } from '../../hooks/useTranslation';
import LoginModal from '../UI/LoginModal';
import ShareModal from '../UI/ShareModal';
import TimerTypeModal from '../UI/TimerTypeModal';
import AddTimerModal from '../UI/AddTimerModal';
import AddStopwatchModal from '../UI/AddStopwatchModal';
import AddWorldClockModal from '../UI/AddWorldClockModal';
import { HexColorPicker } from 'react-colorful';

export default function Header() {
  const { timers, activeTimerId, setActiveTimerId, deleteTimer, updateTimer } = useTimers();
  const { theme, toggleTheme, accentColor } = useTheme();
  const { isFullscreen, isHeaderVisible, headerHideDelay, showHeader, hideHeader } = useFullscreen();
  const { t, changeLanguage, currentLang } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [editingTimer, setEditingTimer] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isTimerTypeModalOpen, setIsTimerTypeModalOpen] = useState(false);
  const [isCountdownModalOpen, setIsCountdownModalOpen] = useState(false);
  const [isStopwatchModalOpen, setIsStopwatchModalOpen] = useState(false);
  const [isWorldClockModalOpen, setIsWorldClockModalOpen] = useState(false);
  const [showAllTabs, setShowAllTabs] = useState(false);

  // 添加滚动引用和悬浮延迟控制
  const tabsScrollRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const leaveTimerRef = useRef(null);
  const mouseMoveTimerRef = useRef(null);
  const [lastMouseMove, setLastMouseMove] = useState(Date.now());

  // 处理全局鼠标移动检测
  const handleGlobalMouseMove = () => {
    // 如果只有一个或没有标签页，则不执行任何操作
    if (timers.length <= 1) {
      return;
    }
    
    // 如果标签栏未展开，则展开它
    if (!showAllTabs) {
      setShowAllTabs(true);
    }
    
    setLastMouseMove(Date.now());
    
    // 清除之前的隐藏计时器
    if (mouseMoveTimerRef.current) {
      clearTimeout(mouseMoveTimerRef.current);
    }
    
    // 设置新的隐藏计时器（5秒后隐藏）
    mouseMoveTimerRef.current = setTimeout(() => {
      setShowAllTabs(false);
    }, 5000);
  };

  // 处理点击当前标签显示所有标签
  const handleActiveTabClick = () => {
    // 如果只有一个或没有标签页，则不执行任何操作
    if (timers.length <= 1) {
      return;
    }
    
    if (!showAllTabs) {
      setShowAllTabs(true);
      // 清除其他定时器
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
      // 启动鼠标移动检测
      handleGlobalMouseMove();
    }
  };


  // 处理鼠标滚轮事件
  const handleWheel = (e) => {
    if (tabsScrollRef.current) {
      e.preventDefault();
      tabsScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // 处理悬浮延迟展开
  const handleMouseEnter = () => {
    // 如果只有一个或没有标签页，则不执行任何操作
    if (timers.length <= 1) {
      return;
    }
    
    // 清除收起定时器（如果用户重新进入）
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    
    // 清除鼠标移动定时器
    if (mouseMoveTimerRef.current) {
      clearTimeout(mouseMoveTimerRef.current);
      mouseMoveTimerRef.current = null;
    }
    
    // 如果已经展开，启动鼠标移动检测
    if (showAllTabs) {
      handleGlobalMouseMove();
      return;
    }
    
    // 清除之前的展开定时器
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    
    // 设置延迟展开
    hoverTimerRef.current = setTimeout(() => {
      setShowAllTabs(true);
      // 展开后启动鼠标移动检测
      handleGlobalMouseMove();
    }, 500); // 500ms延迟
  };

  // 处理鼠标离开
  const handleMouseLeave = () => {
    // 如果只有一个或没有标签页，则不执行任何操作
    if (timers.length <= 1) {
      return;
    }
    
    // 清除展开定时器
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    
    // 不再在鼠标离开时自动收起标签栏
    // 只有在全局鼠标移动停止5秒后才会收起
  };


  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
      if (mouseMoveTimerRef.current) {
        clearTimeout(mouseMoveTimerRef.current);
      }
    };
  }, []);

  // 添加全局鼠标移动监听器
  useEffect(() => {
    // 只有在标签数量大于1时才添加鼠标移动事件监听器
    if (timers.length > 1) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }
    
    // 清理函数
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [showAllTabs, timers.length]); // 依赖showAllTabs状态和计时器数量

  // 当标签栏状态变化或选中标签变化时调整滚动位置
  useEffect(() => {
    if (tabsScrollRef.current && activeTimerId) {
      // 添加小延时，确保DOM已经更新
      setTimeout(() => {
        if (!tabsScrollRef.current) return;
        
        if (showAllTabs) {
          // 在展开状态下，查找展开模式中的激活标签
          const expandedTabElement = document.getElementById(`expanded-timer-tab-${activeTimerId}`);
          if (expandedTabElement) {
            const containerWidth = tabsScrollRef.current.clientWidth;
            const tabBounds = expandedTabElement.getBoundingClientRect();
            const containerBounds = tabsScrollRef.current.getBoundingClientRect();
            
            // 计算标签左边缘相对于容器的位置
            const tabLeft = tabBounds.left - containerBounds.left + tabsScrollRef.current.scrollLeft;
            const tabRight = tabLeft + tabBounds.width;
            
            // 添加一些边距确保完全可见
            const margin = 16;
            let scrollLeftTarget = tabsScrollRef.current.scrollLeft;
            
            // 如果标签左边被遮挡，或者是第一个标签，确保完全显示
            if (tabLeft < margin) {
              scrollLeftTarget = Math.max(0, tabLeft - margin);
            }
            // 如果标签右边被遮挡
            else if (tabRight > containerWidth - margin) {
              scrollLeftTarget = tabRight - containerWidth + margin;
            }
            // 否则将标签居中显示
            else {
              const tabCenter = tabLeft + (tabBounds.width / 2);
              const containerCenter = containerWidth / 2;
              scrollLeftTarget = tabCenter - containerCenter;
            }
            
            // 确保不会滚动出边界
            const maxScrollLeft = tabsScrollRef.current.scrollWidth - containerWidth;
            scrollLeftTarget = Math.max(0, Math.min(scrollLeftTarget, maxScrollLeft));
            
            tabsScrollRef.current.scrollTo({
              left: scrollLeftTarget,
              behavior: 'smooth'
            });
          }
        } else {
          // 收起状态下，确保当前标签可见
          const activeTabElement = document.getElementById(`timer-tab-${activeTimerId}`);
          if (activeTabElement) {
            // 将激活的标签滚动到可见区域
            activeTabElement.scrollIntoView({ 
              behavior: 'smooth',
              block: 'nearest',
              inline: 'center'
            });
          }
        }
      }, 50);
    }
  }, [showAllTabs, activeTimerId]);

  // 打开登录模态框
  const openLoginModal = () => {
    setIsLoginOpen(true);
    if (window.location.hash !== '#login') {
      window.location.hash = 'login';
    }
  };

  // 处理全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`错误: 无法进入全屏模式: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
    // 不需要手动设置 isFullscreen，Fullscreen API 会自动触发 fullscreenchange 事件更新状态
  };

  // 处理语言切换
  const switchLanguage = (lang) => {
    changeLanguage(lang);
    setIsLanguageOpen(false);
  };

  // 开始编辑计时器
  const startEditTimer = (timer) => {
    if (timer.type === 'countdown' || !timer.type) {
      // 倒计时可以编辑所有属性
      setEditingTimer({
        ...timer,
        targetDate: new Date(timer.targetDate).toISOString().substring(0, 10),
        targetTime: new Date(timer.targetDate).toTimeString().substring(0, 5)
      });
    } else {
      // 正计时和世界时钟只能编辑名字和颜色
      setEditingTimer({
        ...timer,
        isLimitedEdit: true // 标记为限制编辑模式
      });
    }
  };

  // 保存编辑的计时器
  const saveEditedTimer = () => {
    if (!editingTimer) return;
    
    if (editingTimer.isLimitedEdit) {
      // 限制编辑模式：只更新名字和颜色
      updateTimer(editingTimer.id, {
        name: editingTimer.name,
        color: editingTimer.color
      });
    } else {
      // 完整编辑模式：更新所有属性（倒计时）
      const targetDateObj = new Date(`${editingTimer.targetDate}T${editingTimer.targetTime}`);
      
      updateTimer(editingTimer.id, {
        name: editingTimer.name,
        targetDate: targetDateObj.toISOString(),
        color: editingTimer.color
      });
    }
    
    setEditingTimer(null);
    setShowColorPicker(false);
  };

  // 处理计时器类型选择
  const handleTimerTypeSelect = (type) => {
    setIsTimerTypeModalOpen(false);
    
    switch (type) {
      case 'countdown':
        setIsCountdownModalOpen(true);
        break;
      case 'stopwatch':
        setIsStopwatchModalOpen(true);
        break;
      case 'worldclock':
        setIsWorldClockModalOpen(true);
        break;
    }
  };

  // 关闭所有模态框
  const closeAllModals = () => {
    setIsTimerTypeModalOpen(false);
    setIsCountdownModalOpen(false);
    setIsStopwatchModalOpen(false);
    setIsWorldClockModalOpen(false);
    if (window.location.hash === '#add') {
      window.location.hash = '';
    }
  };

  // 全屏模式下监听鼠标移动，自动显示/隐藏顶部栏
  useEffect(() => {
    // 只在全屏模式下启用
    if (!isFullscreen) {
      return;
    }

    let hideTimer;

    const handleMouseMove = () => {
      // 鼠标移动时立即显示 Header
      showHeader();

      // 清除之前的隐藏定时器
      if (hideTimer) {
        clearTimeout(hideTimer);
      }

      // 设置新的隐藏定时器
      hideTimer = setTimeout(() => {
        hideHeader();
      }, headerHideDelay);
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [isFullscreen, headerHideDelay, showHeader, hideHeader]);

  // 获取当前活动计时器
  const activeTimer = timers.find(timer => timer.id === activeTimerId) || null;

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40"
      initial={{ y: 0 }}
      animate={{
        y: isFullscreen && !isHeaderVisible ? '-100%' : 0,
        opacity: isFullscreen && !isHeaderVisible ? 0 : 1
      }}
      transition={{ duration: 0.3 }}
    >
      <nav className="glass-card mx-4 mt-4 px-6 py-4 flex items-center justify-between relative">
        {/* Logo - 增强渐变效果，使用较深的相似色 */}
        <motion.div 
          className="flex items-center justify-start z-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 
            className="text-xl md:text-2xl font-bold font-display bg-clip-text text-transparent"
            style={{ 
              backgroundImage: `linear-gradient(45deg, ${accentColor}, ${accentColor}66)` 
            }}
          >
            <a href="https://timepulse.ravelloh.top/">TimePulse</a>
          </h1>
        </motion.div>

        {/* 计时器选择器 - 桌面版 - 动态定位居中显示 */}
        <div 
          className={`hidden md:flex absolute top-1/2 z-0 overflow-hidden ${
            showAllTabs 
              ? 'w-80' 
              : 'w-48'
          }`}
          style={{ 
            left: '50%', 
            transform: 'translate(-50%, -50%)' 
          }}
        >
          <div 
            ref={tabsScrollRef}
            className={`flex items-center space-x-1 py-2 px-2 w-full scrollbar-hide relative ${
              showAllTabs ? 'justify-start overflow-x-auto' : 'justify-center overflow-x-auto'
            }`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              overflowX: 'auto',
              margin: '0 auto',
              cursor: showAllTabs ? 'grab' : 'default',
            }}
            onMouseDown={(e) => {
              if (showAllTabs && tabsScrollRef.current) {
                // 记录起始点击位置
                const startX = e.pageX - tabsScrollRef.current.offsetLeft;
                const scrollLeft = tabsScrollRef.current.scrollLeft;
                
                const handleMouseMove = (e) => {
                  if (!tabsScrollRef.current) return;
                  // 计算滚动距离
                  const x = e.pageX - tabsScrollRef.current.offsetLeft;
                  const walk = (x - startX) * 2; // 加快滚动速度
                  tabsScrollRef.current.scrollLeft = scrollLeft - walk;
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }
            }}
            onTouchStart={(e) => {
              if (tabsScrollRef.current) {
                const startX = e.touches[0].clientX;
                const scrollLeft = tabsScrollRef.current.scrollLeft;
                
                const handleTouchMove = (e) => {
                  if (!tabsScrollRef.current) return;
                  // 阻止页面滚动
                  e.preventDefault();
                  const x = e.touches[0].clientX;
                  const walk = (startX - x); // 滚动距离
                  tabsScrollRef.current.scrollLeft = scrollLeft + walk;
                };
                
                const handleTouchEnd = () => {
                  tabsScrollRef.current.removeEventListener('touchmove', handleTouchMove);
                  tabsScrollRef.current.removeEventListener('touchend', handleTouchEnd);
                };
                
                tabsScrollRef.current.addEventListener('touchmove', handleTouchMove, { passive: false });
                tabsScrollRef.current.addEventListener('touchend', handleTouchEnd);
              }
            }}
          >
            {/* 展开状态的所有标签容器 - 仅在展开时显示 */}
            {showAllTabs && (
              <motion.div 
                className="flex space-x-2 py-2 px-4 min-w-max justify-center w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94], // 更柔和的缓动函数
                  exit: {
                    duration: 0.6,
                    ease: [0.32, 0, 0.67, 0] // 收起时使用更缓慢的缓动
                  }
                }}
              >
                {timers.map((timer, index) => (
                  <motion.button
                    key={`expanded-${timer.id}`}
                    id={`expanded-timer-tab-${timer.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ 
                      duration: 0.4,
                      delay: index * 0.02, // 减少错开延迟
                      ease: [0.25, 0.46, 0.45, 0.94],
                      layout: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
                      exit: {
                        duration: 0.45,
                        delay: (timers.length - 1 - index) * 0.03, // 反向错开延迟收起
                        ease: [0.32, 0, 0.67, 0]
                      }
                    }}
                    whileHover={{ 
                      scale: 1.01,
                      transition: { duration: 0.4, ease: "easeOut" }
                    }}
                    whileTap={{ 
                      scale: 0.99,
                      transition: { duration: 0.2 }
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ease-out ${
                      activeTimerId === timer.id 
                        ? 'text-white shadow-lg' 
                        : 'bg-gray-100/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700/70 backdrop-blur-sm'
                    }`}
                    style={
                      activeTimerId === timer.id 
                        ? { backgroundColor: timer.color || '#0ea5e9' } 
                        : {}
                    }
                    onClick={() => setActiveTimerId(timer.id)}
                    data-insightflare-event="timer_switch"
                    data-insightflare-event-from="desktop_expanded"
                  >
                    {timer.name}
                  </motion.button>
                ))}
              </motion.div>
            )}
            
            {/* 收起状态下只显示当前激活的标签 */}
            {!showAllTabs && (
              <AnimatePresence mode="wait">
                {timers.map(timer => {
                  const isActive = activeTimerId === timer.id;
                  return isActive ? (
                    <motion.button
                      key={timer.id}
                      id={`timer-tab-${timer.id}`}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ 
                        duration: 0.35,
                        ease: [0.25, 0.46, 0.45, 0.94],
                        layout: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
                      }}
                      whileHover={{ 
                        scale: 1.005,
                        transition: { duration: 0.5, ease: "easeOut" }
                      }}
                      whileTap={{ 
                        scale: 0.995,
                        transition: { duration: 0.2 }
                      }}
                      className="px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap text-white shadow-md transition-all duration-300 ease-out hover:shadow-lg"
                      style={{ backgroundColor: timer.color || '#0ea5e9' }}
                      onClick={handleActiveTabClick}
                      data-insightflare-event="timer_switch"
                      data-insightflare-event-from="desktop_collapsed"
                    >
                      {timer.name}
                    </motion.button>
                  ) : null;
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* 右侧按钮组 */}
        <div className="flex items-center justify-end z-10">
          {/* 桌面端所有按钮 */}
          <div className="hidden md:flex items-center">
            {/* 添加计时器按钮 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => {
                setIsTimerTypeModalOpen(true);
                if (window.location.hash !== '#add') {
                  window.location.hash = 'add';
                }
              }}
              data-insightflare-event="timer_create_open"
              data-insightflare-event-from="desktop"
            >
              <FiPlus className="text-xl" />
            </button>

            {/* 背景设置按钮 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => {
                if (window.location.hash !== '#background') {
                  window.location.hash = 'background';
                }
              }}
              data-insightflare-event="background_open"
            >
              <FiImage className="text-xl" />
            </button>

            {/* 分享按钮 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => {
                setIsShareOpen(true);
                if (window.location.hash !== '#share') {
                  window.location.hash = 'share';
                }
              }}
              data-insightflare-event="share_open"
              data-insightflare-event-from="desktop"
            >
              <FiShare2 className="text-xl" />
            </button>

            {/* 全屏按钮 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={toggleFullscreen}
              data-insightflare-event="fullscreen_toggle"
              data-insightflare-event-to={isFullscreen ? 'off' : 'on'}
            >
              {isFullscreen ? <FiMinimize className="text-xl" /> : <FiMaximize className="text-xl" />}
            </button>

            {/* 登录按钮 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={openLoginModal}
              data-insightflare-event="login_open"
              data-insightflare-event-from="desktop"
            >
              <FiUser className="text-xl" />
            </button>

            {/* 主题切换 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={toggleTheme}
              data-insightflare-event="theme_toggle"
              data-insightflare-event-to={theme === 'dark' ? 'light' : 'dark'}
            >
              {theme === 'dark' ? <FiSun className="text-xl" /> : <FiMoon className="text-xl" />}
            </button>

            {/* 语言切换 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => setIsLanguageOpen(true)}
              data-insightflare-event="language_picker_open"
              data-insightflare-event-from="desktop"
            >
              <FiGlobe className="text-xl" />
            </button>

            {/* 设置按钮 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => {
                setIsManageOpen(true);
                if (window.location.hash !== '#manage') {
                  window.location.hash = 'manage';
                }
              }}
              data-insightflare-event="manage_open"
              data-insightflare-event-from="desktop"
            >
              <FiSettings className="text-xl" />
            </button>
          </div>

          {/* 移动端只显示创建计时器和菜单按钮 */}
          <div className="flex items-center md:hidden">
            {/* 移动端创建计时器按钮 */}
            <button
              className="p-2 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => {
                setIsTimerTypeModalOpen(true);
                if (window.location.hash !== '#add') {
                  window.location.hash = 'add';
                }
              }}
              data-insightflare-event="timer_create_open"
              data-insightflare-event-from="mobile"
            >
              <FiPlus className="text-xl" />
            </button>

            {/* 移动端菜单按钮 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-insightflare-event="mobile_menu_toggle"
            >
              {isMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
            </button>
          </div>
        </div>
      </nav>

      {/* 移动端下拉菜单 - 同样使用计时器的颜色和动画效果 */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card mx-4 mt-2 p-4 md:hidden max-h-[70vh] overflow-y-auto"
          >
            {/* 功能按钮区域 - 分两行，每行两个，放在上面 */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{t('header.functions')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* 第一行 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    toggleFullscreen();
                    setIsMenuOpen(false);
                  }}
                  data-insightflare-event="fullscreen_toggle"
                  data-insightflare-event-to={isFullscreen ? 'off' : 'on'}
                >
                  {isFullscreen ? <FiMinimize className="text-xl" /> : <FiMaximize className="text-xl" />}
                  <span className="text-xs ml-2 flex-1 text-right">{isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')}</span>
                </button>

                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    toggleTheme();
                    setIsMenuOpen(false);
                  }}
                  data-insightflare-event="theme_toggle"
                  data-insightflare-event-to={theme === 'dark' ? 'light' : 'dark'}
                >
                  {theme === 'dark' ? <FiSun className="text-xl" /> : <FiMoon className="text-xl" />}
                  <span className="text-xs ml-2 flex-1 text-right">{t('header.themeToggle')}</span>
                </button>

                {/* 第二行 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setIsLanguageOpen(true);
                    setIsMenuOpen(false);
                  }}
                  data-insightflare-event="language_picker_open"
                  data-insightflare-event-from="mobile"
                >
                  <FiGlobe className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">{t('header.language')}</span>
                </button>

                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setIsManageOpen(true);
                    setIsMenuOpen(false);
                    if (window.location.hash !== '#manage') {
                      window.location.hash = 'manage';
                    }
                  }}
                  data-insightflare-event="manage_open"
                  data-insightflare-event-from="mobile"
                >
                  <FiSettings className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">{t('header.settings')}</span>
                </button>
                
                {/* 添加"登录"按钮 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    openLoginModal();
                    setIsMenuOpen(false);
                  }}
                  data-insightflare-event="login_open"
                  data-insightflare-event-from="mobile"
                >
                  <FiUser className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">{t('header.login')}</span>
                </button>
                
                {/* 添加"分享"按钮 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setIsShareOpen(true);
                    setIsMenuOpen(false);
                    if (window.location.hash !== '#share') {
                      window.location.hash = 'share';
                    }
                  }}
                  data-insightflare-event="share_open"
                  data-insightflare-event-from="mobile"
                >
                  <FiShare2 className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">{t('timer.share')}</span>
                </button>

                {/* 背景设置按钮 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (window.location.hash !== '#background') {
                      window.location.hash = 'background';
                    }
                  }}
                  data-insightflare-event="background_open"
                >
                  <FiImage className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">背景设置</span>
                </button>

                {/* 全屏设置按钮 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (window.location.hash !== '#fullscreen-settings') {
                      window.location.hash = 'fullscreen-settings';
                    }
                  }}
                  data-insightflare-event="fullscreen_settings_open"
                >
                  <FiMaximize className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">全屏设置</span>
                </button>
              </div>
            </div>

            {/* 计时器选择区域 - 只有有滚动条时才显示，放在下面 */}
            {timers.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('header.timers')}</h3>
                <div className="flex flex-col space-y-2 max-h-48 overflow-y-auto">
                  {timers.map(timer => (
                    <motion.button
                      key={timer.id}
                      layout
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`px-4 py-2 rounded-lg text-left ${
                        activeTimerId === timer.id 
                          ? 'text-white' 
                          : 'bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20'
                      }`}
                      style={
                        activeTimerId === timer.id 
                          ? { backgroundColor: timer.color || '#0ea5e9' } 
                          : {}
                      }
                      onClick={() => {
                        setActiveTimerId(timer.id);
                        setIsMenuOpen(false);
                      }}
                      data-insightflare-event="timer_switch"
                      data-insightflare-event-from="mobile_menu"
                    >
                      {timer.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 管理计时器弹窗 */}
      <AnimatePresence>
        {isManageOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-4"
            onClick={() => {
              setIsManageOpen(false);
              setEditingTimer(null);
              if (window.location.hash === '#manage') {
                window.location.hash = '';
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-md m-4 p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t('header.manage')}</h2>
                <button
                  className="p-1 rounded-full btn-glass-hover cursor-pointer"
                  onClick={() => {
                    setIsManageOpen(false);
                    setEditingTimer(null);
                    if (window.location.hash === '#manage') {
                      window.location.hash = '';
                    }
                  }}
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {editingTimer ? (
                <div className="space-y-4">
                  <h3 className="font-medium mb-2">
                    {editingTimer.isLimitedEdit ? t('modal.edit.editTimer') : t('modal.edit.editCountdown')}
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('modal.edit.name')}</label>
                    <input
                      type="text"
                      value={editingTimer.name}
                      onChange={(e) => setEditingTimer({...editingTimer, name: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>

                  {/* 只有倒计时可以编辑日期和时间 */}
                  {!editingTimer.isLimitedEdit && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">{t('modal.edit.date')}</label>
                        <input
                          type="date"
                          value={editingTimer.targetDate}
                          onChange={(e) => setEditingTimer({...editingTimer, targetDate: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">{t('modal.edit.time')}</label>
                        <input
                          type="time"
                          value={editingTimer.targetTime}
                          onChange={(e) => setEditingTimer({...editingTimer, targetTime: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">{t('modal.edit.color')}</label>
                    <div 
                      className="h-10 w-full rounded-lg cursor-pointer"
                      style={{ backgroundColor: editingTimer.color }}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    ></div>
                    {showColorPicker && (
                      <div className="mt-2">
                        <HexColorPicker 
                          color={editingTimer.color} 
                          onChange={(color) => setEditingTimer({...editingTimer, color})} 
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <button
                      className="flex-1 btn-glass-secondary"
                      onClick={() => setEditingTimer(null)}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      className="flex-1 btn-glass-primary flex items-center justify-center"
                      onClick={saveEditedTimer}
                      data-insightflare-event="timer_edit_save"
                    >
                      <FiSave className="mr-2" />
                      {t('modal.edit.saveChanges')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {timers.map(timer => (
                    <div 
                      key={timer.id}
                      className="flex items-center justify-between p-3 mb-2 rounded-lg bg-white/30 dark:bg-black/30 hover:bg-white/50 dark:hover:bg-black/50"
                      style={{
                        borderLeft: `4px solid ${timer.color || '#0ea5e9'}`
                      }}
                    >
                      <div>
                        <h3 className="font-medium">{timer.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {timer.type === 'stopwatch' 
                            ? t('timer.stopwatch')
                            : timer.type === 'worldclock' 
                            ? `${timer.country || t('timer.worldClock')} - ${timer.timezone || ''}`
                            : new Date(timer.targetDate).toLocaleString()
                          }
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {/* 所有计时器都可以编辑名字和颜色 */}
                        <button
                          className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer"
                          onClick={() => startEditTimer(timer)}
                          data-insightflare-event="timer_edit_open"
                          data-insightflare-event-type={timer.type || 'countdown'}
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer"
                          onClick={() => deleteTimer(timer.id)}
                          data-insightflare-event="timer_delete"
                          data-insightflare-event-type={timer.type || 'countdown'}
                        >
                          <FiX />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 语言切换弹窗 */}
      <AnimatePresence>
        {isLanguageOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setIsLanguageOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-sm m-4 p-6 rounded-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t('header.selectLanguage')}</h2>
                <button
                  className="p-1 rounded-full btn-glass-hover cursor-pointer"
                  onClick={() => setIsLanguageOpen(false)}
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  className="w-full px-4 py-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 text-left transition-all cursor-pointer"
                  onClick={() => switchLanguage('zh-CN')}
                  data-insightflare-event="language_change"
                  data-insightflare-event-lang="zh-CN"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🇨🇳</span>
                    <div>
                      <div className="font-medium">{t('header.chinese')}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t('header.chineseSimplified')}</div>
                    </div>
                  </div>
                </button>

                <button
                  className="w-full px-4 py-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 text-left transition-all cursor-pointer"
                  onClick={() => switchLanguage('en-US')}
                  data-insightflare-event="language_change"
                  data-insightflare-event-lang="en-US"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🇺🇸</span>
                    <div>
                      <div className="font-medium">{t('header.english')}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t('header.englishUS')}</div>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 登录模态框 */}
      <AnimatePresence>
        {isLoginOpen && (
          <LoginModal onClose={() => {
            setIsLoginOpen(false);
            if (window.location.hash === '#login') {
              window.location.hash = '';
            }
          }} />
        )}
      </AnimatePresence>

      {/* 计时器类型选择模态框 */}
      <AnimatePresence>
        {isTimerTypeModalOpen && (
          <TimerTypeModal 
            onClose={closeAllModals}
            onSelectType={handleTimerTypeSelect}
          />
        )}
      </AnimatePresence>

      {/* 添加倒计时模态框 */}
      <AnimatePresence>
        {isCountdownModalOpen && (
          <AddTimerModal onClose={closeAllModals} />
        )}
      </AnimatePresence>

      {/* 添加正计时模态框 */}
      <AnimatePresence>
        {isStopwatchModalOpen && (
          <AddStopwatchModal onClose={closeAllModals} />
        )}
      </AnimatePresence>

      {/* 添加世界时钟模态框 */}
      <AnimatePresence>
        {isWorldClockModalOpen && (
          <AddWorldClockModal onClose={closeAllModals} />
        )}
      </AnimatePresence>

      {/* 分享模态框 */}
      <AnimatePresence>
        {isShareOpen && (
          <ShareModal onClose={() => {
            setIsShareOpen(false);
            if (window.location.hash === '#share') {
              window.location.hash = '';
            }
          }} />
        )}
      </AnimatePresence>
    </motion.header>
  );
}
